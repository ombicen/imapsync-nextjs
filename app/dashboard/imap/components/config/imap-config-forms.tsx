'use client';

import { useState } from 'react';
import { ImapConnectionConfig } from '@/app/dashboard/imap/types/imap';

interface ImapConfigFormsProps {
  config: ImapConnectionConfig | null;
  onSubmit: (config: ImapConnectionConfig) => void;
}

export function ImapConfigForms({ config, onSubmit }: ImapConfigFormsProps) {
  const [formData, setFormData] = useState<ImapConnectionConfig>({
    host: config?.host || '',
    port: config?.port || 993,
    username: config?.username || '',
    password: config?.password || '',
    secure: config?.secure ?? true,
    tls: config?.tls ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Host
        </label>
        <input
          type="text"
          value={formData.host}
          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Port
        </label>
        <input
          type="number"
          value={formData.port}
          onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Secure Connection
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="secure"
              value="true"
              checked={formData.secure}
              onChange={(e) => setFormData({ ...formData, secure: true })}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="secure"
              value="false"
              checked={!formData.secure}
              onChange={(e) => setFormData({ ...formData, secure: false })}
            />
            <span>No</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          TLS
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tls"
              value="true"
              checked={formData.tls}
              onChange={(e) => setFormData({ ...formData, tls: true })}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tls"
              value="false"
              checked={!formData.tls}
              onChange={(e) => setFormData({ ...formData, tls: false })}
            />
            <span>No</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Configuration
      </button>
    </form>
  );
}
