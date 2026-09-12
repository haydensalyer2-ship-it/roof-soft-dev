import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  email: string;
  displayName: string;
  organizationId: string;
  role: 'owner' | 'manager' | 'sales_rep';
}

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
  if (existing.exists() && existing.data().organizationId) {
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
  const organizationId = invitation?.organizationId || user.uid;
  const invitedName = invitation ? `${invitation.firstName} ${invitation.lastName}`.trim() : '';
  const displayName = user.displayName?.trim() || invitedName || email.split('@')[0] || 'Owner';
  const role = invitation?.role || 'owner';

  if (!invitation) {
    await setDoc(doc(db, 'organizations', organizationId), {
      name: '', website: '', phone: '', address: '', ownerId: user.uid, createdAt: serverTimestamp(),
    });
  }
  const profile: UserProfile = { email, displayName, organizationId, role };
  const profileDocument = invitation ? { ...profile, invitationId } : profile;
  if (existing.exists()) await setDoc(userRef, profile, { merge: true });
  else await setDoc(userRef, { ...profileDocument, createdAt: serverTimestamp() });
  if (invitation) await updateDoc(invitationRef, { acceptedBy: user.uid, acceptedAt: serverTimestamp() });
  else {
    const [firstName, ...lastNameParts] = displayName.split(/\s+/);
    await setDoc(doc(db, 'team', user.uid), {
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
