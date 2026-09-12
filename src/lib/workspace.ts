import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  email: string;
  displayName: string;
  organizationId: string;
  role: 'owner' | 'manager' | 'sales_rep';
  workspaceVersion: number;
}

/** Must stay aligned with the workspaceVersion validation in firestore.rules. */
export const WORKSPACE_VERSION = 2 as const;

export const invitationIdForEmail = (email: string) => encodeURIComponent(email.trim().toLowerCase());

interface Invitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: 'manager' | 'sales_rep';
}

/**
 * Provisioning is intentionally idempotent. A landing-page signup owns a brand-new
 * workspace unless an owner invited their verified email into an existing one.
 */
export async function ensureWorkspace(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  if (existing.exists() && existing.data().organizationId && existing.data().workspaceVersion === WORKSPACE_VERSION) {
    const profile = existing.data() as UserProfile;
    const authenticatedName = user.displayName?.trim();
    if (authenticatedName && authenticatedName !== profile.displayName) {
      await updateDoc(userRef, { displayName: authenticatedName });
      if (profile.role === 'owner') {
        const [firstName, ...lastNameParts] = authenticatedName.split(/\s+/);
        await setDoc(doc(db, 'team', user.uid), { firstName, lastName: lastNameParts.join(' ') }, { merge: true });
      }
      return { ...profile, displayName: authenticatedName };
    }
    return profile;
  }

  const email = user.email || '';
  const invitationId = invitationIdForEmail(email);
  const invitationRef = doc(db, 'invitations', invitationId);
  const invitationSnapshot = email ? await getDoc(invitationRef) : null;
  const invitation = invitationSnapshot?.exists() ? invitationSnapshot.data() as Invitation : null;
  const existingProfile = existing.exists() ? existing.data() as Partial<UserProfile> : null;
  const isExistingRep = existingProfile?.organizationId && existingProfile.role !== 'owner';
  // Move legacy owners to a clean namespace once, while keeping invited reps
  // attached to the company that invited them.
  const organizationId = invitation?.organizationId
    || (isExistingRep ? existingProfile.organizationId! : existing.exists() ? `${user.uid}-workspace-v2` : user.uid);
  const invitedName = invitation ? `${invitation.firstName} ${invitation.lastName}`.trim() : '';
  const displayName = user.displayName?.trim() || invitedName || email.split('@')[0] || 'Owner';
  const role = invitation?.role || (isExistingRep ? existingProfile.role! : 'owner');
  const profile: UserProfile = { email, displayName, organizationId, role, workspaceVersion: WORKSPACE_VERSION };

  const batch = writeBatch(db);
  if (role === 'owner') {
    batch.set(doc(db, 'organizations', organizationId), {
      name: '', website: '', phone: '', address: '', ownerId: user.uid, createdAt: serverTimestamp(),
    });
  }
  const profileDocument = invitation ? { ...profile, invitationId } : profile;
  batch.set(userRef, existing.exists() ? profileDocument : { ...profileDocument, createdAt: serverTimestamp() }, { merge: existing.exists() });
  if (invitation) batch.update(invitationRef, { acceptedBy: user.uid, acceptedAt: serverTimestamp() });
  await batch.commit();
  if (role === 'owner') {
    const [firstName, ...lastNameParts] = displayName.split(/\s+/);
    await setDoc(doc(db, 'team', existing.exists() ? `${user.uid}-v2` : user.uid), {
      userId: user.uid,
      organizationId,
      firstName: firstName || 'Owner',
      lastName: lastNameParts.join(' '),
      email,
      phone: '',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }
  return profile;
}
