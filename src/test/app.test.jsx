import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';

describe('Sajian Catering Ultra-Clean Multi-POV Frontend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders rich animated Royal Emerald showcase with Sajian Catering WA CTA and migrates legacy Sarasa storage', () => {
    localStorage.setItem(
      'sajian_v3_config',
      JSON.stringify({
        brand: { name: 'SARASA CATERING', shortName: 'SARASA', subName: 'CATERING', tagline: 'Sarasa Catering Demo' },
        business: { whatsappNumber: '6281234567890', bankAccountNumber: '521-089-4412' },
      })
    );
    render(<App />);
    expect(screen.getAllByText(/SAJIAN/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/SARASA/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/ROYAL BUFFET/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Katalog Paket Catering Pilihan')).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen Command Center')).not.toBeInTheDocument();
    const waLink = screen.getByRole('link', { name: /Konsultasi via WhatsApp/i });
    expect(waLink).toHaveAttribute('href', expect.stringContaining('wa.me/628569000604'));
  });

  it('toggles mobile hamburger menu with section links', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /Buka menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /Tutup menu/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('button', { name: 'Katalog Menu' }).length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: /Tutup menu/i }));
    expect(screen.getAllByRole('button', { name: 'Katalog Menu' }).length).toBe(1);
  });

  it('opens slide-over package detail drawer and pre-selects package in booking calculator', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /Detail Lengkap/i })[0]);
    expect(screen.getByText(/Komposisi Hidangan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Informasi Alergen/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Pilih Paket Ini untuk Pesan/i }));
    expect(screen.getByText('Kalkulator Estimasi Biaya & Formulir Booking')).toBeInTheDocument();
  });

  it('allows client to inspect bookings inside Portal Klien without exposing HPP', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /Portal Klien/i })[0]);
    expect(screen.getByText('Portal Pemantauan Pesanan Klien')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Contoh: SJC-2026-001/i), { target: { value: 'SJC-2026-001' } });
    fireEvent.change(screen.getByPlaceholderText(/0812-8890-1122/i), { target: { value: '0812-8890-1122' } });
    fireEvent.click(screen.getByRole('button', { name: /Buka Pesanan/i }));
    expect(await screen.findByText('Ibu Ratna Kusuma')).toBeInTheDocument();
    expect(screen.queryByText(/HPP/i)).not.toBeInTheDocument();
  });

  it('allows Admin to login via full-screen portal and access Business Settings + Account Security while keeping Developer Console hidden', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Portal Internal Tim/i }));
    expect(screen.getByText(/Login Administrator Bisnis/i)).toBeInTheDocument();
    expect(screen.queryByText(/Panduan Akun Preview/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email atau Username/i), { target: { value: 'admin@sajiancatering.id' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Admin#2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Admin/i }));

    expect(await screen.findByRole('heading', { name: /Pusat Kendali/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pengaturan Bisnis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Keamanan & Akun/i })).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
  });

  it('gates Kitchen dashboard behind email/password authentication and enforces role scope', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Portal Internal Tim/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Dapur/i }));

    fireEvent.change(screen.getByLabelText(/Email atau Username/i), { target: { value: 'dapur' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'SalahPassword1' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Dapur/i }));
    expect(await screen.findByText(/Password tidak valid/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Dapur#2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Dapur/i }));
    expect(await screen.findByRole('heading', { name: 'Kitchen Command Center' })).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
  });

  it('unlocks Developer-Only sidebar console via Ctrl+Shift+D and Developer credentials', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    expect(screen.getByText(/Login Pengembang Sistem/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email atau Username/i), { target: { value: 'dev@sajiancatering.id' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Dev#Sajian99' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard Developer/i }));

    expect(await screen.findByRole('heading', { name: 'Pengaturan Sistem & Kustomisasi Pengembang' })).toBeInTheDocument();
    expect(screen.getByText('Theme & Design Token Customizer')).toBeInTheDocument();
  });

  it('validates short WhatsApp numbers cleanly inside BookingCalculator', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Contoh: Ibu Siti Rahmawati/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Contoh: 0812-3456-7890/i), {
      target: { value: '08123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nama gedung\/jalan/i), {
      target: { value: 'Jl. Sudirman No. 10, Jakarta Pusat' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Kunci Jadwal & Buat Pesanan/i }));
    expect(screen.getByText(/Masukkan nomor WhatsApp aktif minimal 9 digit angka/i)).toBeInTheDocument();
  });
});
