import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Settings() {
  const { user, enabled, updateProfileInfo, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; error: boolean } | null>(null);

  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ text: string; error: boolean } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      await updateProfileInfo(name);
      setProfileMessage({ text: 'Profile updated successfully.', error: false });
    } catch (err) {
      setProfileMessage({ text: err instanceof Error ? err.message : 'Failed to update profile.', error: true });
    } finally {
      setProfileBusy(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPwdMessage({ text: 'Passwords do not match.', error: true });
      return;
    }
    setPwdBusy(true);
    setPwdMessage(null);
    try {
      if (auth?.currentUser) {
        await updatePassword(auth.currentUser, password);
        setPwdMessage({ text: 'Password updated successfully.', error: false });
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('Password management is not available in demo mode.');
      }
    } catch (err) {
      // Firebase throwsauth/requires-recent-login if user needs to re-auth
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      if (msg.includes('requires-recent-login')) {
        setPwdMessage({ text: 'Please sign out and sign back in to change your password.', error: true });
      } else {
        setPwdMessage({ text: msg, error: true });
      }
    } finally {
      setPwdBusy(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!auth || !user.email) return;
    setPwdBusy(true);
    setPwdMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwdMessage({ text: `Reset email sent to ${user.email}.`, error: false });
    } catch (err) {
      setPwdMessage({ text: err instanceof Error ? err.message : 'Failed to send reset email.', error: true });
    } finally {
      setPwdBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate('/signin', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account.';
      if (msg.includes('requires-recent-login')) {
        setDeleteError('Please sign out and sign back in to delete your account.');
      } else {
        setDeleteError(msg);
      }
      setDeleteBusy(false);
    }
  };

  return (
    <div className="container-site py-16 bg-grain min-h-[85vh]">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="eyebrow mb-1">Account</p>
            <h1 className="heading-serif text-4xl text-bone">Settings</h1>
          </div>
          <Link to="/account" className="btn-outline text-xs px-4 py-2">
            Back to Dashboard
          </Link>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface p-7 border border-ink-600/30"
          >
            <h2 className="heading-serif text-2xl text-bone mb-6">Profile Settings</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-bone/55 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-bone/35 mb-1.5">
                  Email Address (Non-editable)
                </label>
                <input
                  type="email"
                  value={user.email ?? ''}
                  disabled
                  className="field opacity-50 cursor-not-allowed bg-ink-800"
                />
              </div>

              {profileMessage && (
                <p className={`text-xs font-medium ${profileMessage.error ? 'text-red-500' : 'text-green-600'}`}>
                  {profileMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={profileBusy}
                className="btn-primary px-6 text-xs uppercase tracking-wider"
              >
                {profileBusy ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </motion.div>

          {/* Security / Password Settings */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-surface p-7 border border-ink-600/30"
          >
            <h2 className="heading-serif text-2xl text-bone mb-2">Password & Security</h2>
            <p className="text-xs text-bone/50 mb-6">
              Update your account password or trigger a reset link.
            </p>

            {enabled ? (
              <div className="space-y-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone/55 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone/55 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="field"
                    />
                  </div>

                  {pwdMessage && (
                    <p className={`text-xs font-medium ${pwdMessage.error ? 'text-red-500' : 'text-green-600'}`}>
                      {pwdMessage.text}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={pwdBusy}
                      className="btn-primary px-6 text-xs uppercase tracking-wider"
                    >
                      {pwdBusy ? 'Updating...' : 'Update Password'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={pwdBusy}
                      className="btn-outline px-6 text-xs uppercase tracking-wider"
                    >
                      Send Reset Email
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <p className="text-xs text-gold font-medium bg-gold/5 border border-gold/20 p-4 rounded-xl">
                Password management is disabled in Demo Mode.
              </p>
            )}
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-surface p-7 border border-red-500/20 bg-red-500/[0.01]"
          >
            <h2 className="heading-serif text-2xl text-red-500 mb-2">Danger Zone</h2>
            <p className="text-xs text-bone/50 mb-6">
              Permanently delete your account. This action is irreversible.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white hover:bg-red-700 btn relative overflow-hidden text-xs uppercase tracking-wider px-6"
            >
              Delete Account
            </button>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-surface max-w-md w-full p-6 md:p-8 bg-ink border border-ink-600"
            >
              <h3 className="heading-serif text-2xl text-bone mb-3">Delete Account?</h3>
              <p className="text-sm text-bone/60 leading-relaxed mb-6">
                Are you absolutely sure you want to delete your Levush account? All your order history, points, and saved items will be permanently erased. This action cannot be undone.
              </p>

              {deleteError && (
                <p className="text-xs text-red-500 font-medium mb-4">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteBusy}
                  className="bg-red-600 text-white hover:bg-red-700 flex-1 btn text-xs py-3"
                >
                  {deleteBusy ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  disabled={deleteBusy}
                  className="btn-outline flex-1 text-xs py-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
