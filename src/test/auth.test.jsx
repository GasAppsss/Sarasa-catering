import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';

describe('Staff Login, Forgot Password (OTP & Recovery Key) & Account Security', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('completes Forgot Password via 6-digit Email OTP for Admin and signs in with new password', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Admin & Tim/i }));
    fireEvent.click(screen.getByRole('button', { name: /Lupa Password\?/i }));

    expect(screen.getByRole('heading', { name: /Lupa Password/i })).toBeInTheDocument();

    // Step 1: Request OTP
    fireEvent.change(screen.getByLabelText(/Email atau Username Terdaftar/i), {
      target: { value: 'admin@sajiancatering.id' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Kirim Kode OTP 6-Digit/i }));

    // Step 2: Preview Inbox shows 6-digit OTP -> click Isi Otomatis -> Verify
    const otpEl = await screen.findByTestId('preview-otp-code');
    expect(otpEl.textContent).toMatch(/^\d{6}$/);
    fireEvent.click(screen.getByRole('button', { name: /Isi Otomatis/i }));
    fireEvent.click(screen.getByRole('button', { name: /Verifikasi Kode OTP/i }));

    // Step 3: Enter strong new password
    fireEvent.change(await screen.findByLabelText(/^Password Baru$/i), {
      target: { value: 'AdminBaru#2027' },
    });
    fireEvent.change(screen.getByLabelText(/Konfirmasi Password Baru/i), {
      target: { value: 'AdminBaru#2027' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Simpan Password Baru/i }));

    // Step 4: Success screen -> back to login -> sign in with new password
    expect(await screen.findByText(/Password Berhasil Direset!/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Masuk dengan Password Baru/i }));

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'AdminBaru#2027' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Admin/i }));
    expect(await screen.findByRole('heading', { name: /Pusat Kendali/i })).toBeInTheDocument();
  });

  it('completes Forgot Password via Master Recovery Key for Developer and signs in with new password', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Developer$/i }));
    expect(screen.getByText(/Login Pengembang Sistem/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lupa Password\?/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Master Recovery Key/i }));

    fireEvent.change(screen.getByLabelText(/Email atau Username Akun/i), {
      target: { value: 'dev@sajiancatering.id' },
    });
    fireEvent.change(screen.getByLabelText(/Master Recovery Key/i), {
      target: { value: 'SJC-DEV-9Q4W-8R6T' },
    });
    fireEvent.change(screen.getByLabelText(/^Password Baru$/i), {
      target: { value: 'DevBaru#2028' },
    });
    fireEvent.change(screen.getByLabelText(/Konfirmasi Password Baru/i), {
      target: { value: 'DevBaru#2028' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password dengan Recovery Key/i }));

    expect(await screen.findByText(/Password Berhasil Direset!/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Masuk dengan Password Baru/i }));

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'DevBaru#2028' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Developer/i }));
    expect(
      await screen.findByRole('heading', { name: 'Pengaturan Sistem & Kustomisasi Pengembang' })
    ).toBeInTheDocument();
  });

  it('allows Admin to change own password and rotate Master Recovery Key inside Account Security tab', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Admin & Tim/i }));
    fireEvent.change(screen.getByLabelText(/Email atau Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Admin#2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Admin/i }));

    expect(await screen.findByRole('heading', { name: /Pusat Kendali/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Keamanan & Akun/i }));

    // Change password
    fireEvent.change(screen.getByLabelText(/^Password Saat Ini$/i), { target: { value: 'Admin#2026' } });
    fireEvent.change(screen.getByLabelText(/^Password Baru$/i), { target: { value: 'AdminGanti#2029' } });
    fireEvent.change(screen.getByLabelText(/^Konfirmasi Password Baru$/i), { target: { value: 'AdminGanti#2029' } });
    fireEvent.click(screen.getByRole('button', { name: /Simpan Password Baru/i }));
    expect(await screen.findByText(/Password akun Anda telah diperbarui\./i)).toBeInTheDocument();

    // Rotate Recovery Key with new password
    fireEvent.change(screen.getByLabelText(/Konfirmasi Password Saat Ini untuk Rotasi Key/i), {
      target: { value: 'AdminGanti#2029' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Buat Ulang Master Recovery Key/i }));
    expect(await screen.findByText(/Recovery Key Baru \(Tampil 1 Kali\)/i)).toBeInTheDocument();
  });

  it('enforces brute-force lockout after 5 consecutive failed logins', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Admin & Tim/i }));
    fireEvent.change(screen.getByLabelText(/Email atau Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'SalahTerus9' } });

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Admin/i }));
      await screen.findByRole('alert');
    }
    expect(screen.getByRole('alert').textContent).toMatch(/dikunci sementara/i);
  });
});
