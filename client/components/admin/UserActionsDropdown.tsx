'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Eye,
  Coins,
  CreditCard,
  Trash2,
  Shield,
  ShieldOff,
} from 'lucide-react';
import { IAdminUserProfile } from '@/shared/types/admin';
import { useClickOutside } from '@/client/hooks/useClickOutside';
import { adminFetch } from '@/client/utils/admin-api-client';

interface IUserActionsDropdownProps {
  user: IAdminUserProfile;
  onUpdate: () => void;
}

export function UserActionsDropdown({ user, onUpdate }: IUserActionsDropdownProps): React.ReactElement {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'credits' | 'subscription' | 'delete' | 'role' | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  const handleAction = (action: 'credits' | 'subscription' | 'delete' | 'role' | 'view') => {
    setIsOpen(false);
    if (action === 'view') {
      router.push(`/dashboard/admin/users/${user.id}`);
    } else {
      setActiveModal(action);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          aria-label="User actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            <DropdownItem
              icon={Eye}
              label="View Details"
              onClick={() => handleAction('view')}
            />
            <DropdownDivider />
            <DropdownItem
              icon={user.role === 'admin' ? ShieldOff : Shield}
              label={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              onClick={() => handleAction('role')}
            />
            <DropdownItem
              icon={Coins}
              label="Adjust Credits"
              onClick={() => handleAction('credits')}
            />
            <DropdownItem
              icon={CreditCard}
              label="Change Subscription"
              onClick={() => handleAction('subscription')}
            />
            <DropdownDivider />
            <DropdownItem
              icon={Trash2}
              label="Delete User"
              onClick={() => handleAction('delete')}
              variant="danger"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'credits' && (
        <CreditAdjustmentModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={onUpdate}
        />
      )}
      {activeModal === 'subscription' && (
        <SubscriptionModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={onUpdate}
        />
      )}
      {activeModal === 'delete' && (
        <DeleteUserModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={onUpdate}
        />
      )}
      {activeModal === 'role' && (
        <RoleChangeModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}

// Dropdown Components
interface IDropdownItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function DropdownItem({ icon: Icon, label, onClick, variant = 'default' }: IDropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4 mr-2.5" />
      {label}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

// Modal Components
interface IModalProps {
  user: IAdminUserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

function CreditAdjustmentModal({ user, onClose, onSuccess }: IModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const previewBalance = amount ? user.credits_balance + parseInt(amount) : user.credits_balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await adminFetch('/api/admin/credits/adjust', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          amount: parseInt(amount),
          reason,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust credits');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAdjust = (value: number) => {
    setAmount(value.toString());
    setReason(value > 0 ? 'Admin credit bonus' : 'Admin credit adjustment');
  };

  return (
    <Modal title="Adjust Credits" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">User</label>
          <p className="mt-1 text-sm text-slate-900">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Quick Adjust</label>
          <div className="flex flex-wrap gap-2">
            {[-100, -50, -10, 10, 50, 100, 500].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => quickAdjust(val)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  val < 0
                    ? 'border-red-200 text-red-700 hover:bg-red-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                {val > 0 ? '+' : ''}
                {val}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Custom Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., 50 or -20"
            required
          />
          <p className="mt-1 text-sm text-slate-500">
            Current: <span className="font-medium">{user.credits_balance}</span> →
            New: <span className={`font-medium ${previewBalance < 0 ? 'text-red-600' : ''}`}>{previewBalance}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., Customer support compensation"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ModalActions
          onClose={onClose}
          submitLabel="Adjust Credits"
          submitting={submitting}
        />
      </form>
    </Modal>
  );
}

function SubscriptionModal({ user, onClose, onSuccess }: IModalProps) {
  const [tier, setTier] = useState(user.subscription_tier || '');
  const [status, setStatus] = useState(user.subscription_status || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subscription_tier: tier || null,
          subscription_status: status || null,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Change Subscription" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">User</label>
          <p className="mt-1 text-sm text-slate-900">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Subscription Tier</label>
          <select
            value={tier}
            onChange={e => setTier(e.target.value)}
            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">No Subscription (Free)</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">None</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This only updates the database record. It does not create or
            modify actual Stripe subscriptions. Use this for manual overrides or corrections.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ModalActions
          onClose={onClose}
          submitLabel="Update Subscription"
          submitting={submitting}
        />
      </form>
    </Modal>
  );
}

function RoleChangeModal({ user, onClose, onSuccess }: IModalProps) {
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');

    try {
      await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={newRole === 'admin' ? 'Grant Admin Access' : 'Remove Admin Access'}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">User</label>
          <p className="mt-1 text-sm text-slate-900">{user.email}</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-700">
            {newRole === 'admin' ? (
              <>
                This will grant <strong>{user.email}</strong> full admin access to the admin
                panel, including the ability to manage users, credits, and subscriptions.
              </>
            ) : (
              <>
                This will remove admin access from <strong>{user.email}</strong>. They will no
                longer be able to access the admin panel.
              </>
            )}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ModalActions
          onClose={onClose}
          submitLabel={newRole === 'admin' ? 'Grant Admin' : 'Remove Admin'}
          submitting={submitting}
          onSubmit={handleConfirm}
          variant={newRole === 'user' ? 'danger' : 'primary'}
        />
      </div>
    </Modal>
  );
}

function DeleteUserModal({ user, onClose, onSuccess }: IModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmEmail === user.email;

  const handleDelete = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    setError('');

    try {
      await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> This action is irreversible. All user data including
            credits, subscriptions, and transaction history will be permanently deleted.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Type <span className="font-mono text-red-600">{user.email}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="user@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ModalActions
          onClose={onClose}
          submitLabel="Delete User"
          submitting={submitting}
          onSubmit={handleDelete}
          variant="danger"
          disabled={!canDelete}
        />
      </div>
    </Modal>
  );
}

// Shared Modal Components
interface IModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: IModalWrapperProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-slate-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

interface IModalActionsProps {
  onClose: () => void;
  submitLabel: string;
  submitting: boolean;
  onSubmit?: () => void;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

function ModalActions({
  onClose,
  submitLabel,
  submitting,
  onSubmit,
  variant = 'primary',
  disabled,
}: IModalActionsProps) {
  const buttonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

  const content = (
    <div className="flex justify-end space-x-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        Cancel
      </button>
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || disabled}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClass}`}
        >
          {submitting ? 'Processing...' : submitLabel}
        </button>
      ) : (
        <button
          type="submit"
          disabled={submitting || disabled}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClass}`}
        >
          {submitting ? 'Processing...' : submitLabel}
        </button>
      )}
    </div>
  );

  return content;
}
