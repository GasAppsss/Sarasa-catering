import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';

describe('Sajian Catering Ultra-Clean Multi-POV Frontend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders rich animated Royal Emerald showcase without exposing internal POVs', () => {
    render(<App />);
    expect(screen.getAllByText(/SAJIAN/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ROYAL BUFFET/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Katalog Paket Catering Pilihan')).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen Command Center')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: /Buka Pesanan/i }));
    expect(await screen.findByText('Ibu Ratna Kusuma')).toBeInTheDocument();
    expect(screen.queryByText(/HPP/i)).not.toBeInTheDocument();
  });

  it('allows Admin to login via full-screen portal and access Business Settings + Account Security while keeping Developer Console hidden', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Admin & Tim/i }));
    expect(screen.getByText(/Login Administrator Bisnis/i)).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: /Login Admin & Tim/i }));
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
});
