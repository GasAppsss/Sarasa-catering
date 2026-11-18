import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';

describe('Sajian Catering Multi-POV Frontend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders public Sajian Catering client showcase and hides internal POVs by default', () => {
    render(<App />);
    expect(screen.getAllByText(/SAJIAN/i).length).toBeGreaterThan(0);
    expect(screen.getByText('ROYAL BUFFET')).toBeInTheDocument();
    expect(screen.getByText('Katalog Paket Catering Pilihan')).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen Command Center')).not.toBeInTheDocument();
  });

  it('allows client to inspect bookings inside Portal Klien without exposing HPP', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /Portal Klien/i })[0]);
    expect(screen.getByText('Portal Pemantauan Pesanan Klien')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Buka Pesanan/i }));
    expect(await screen.findByText('Ibu Ratna Kusuma')).toBeInTheDocument();
    expect(screen.queryByText(/HPP/i)).not.toBeInTheDocument();
  });

  it('allows Admin to access Business Settings while keeping Developer Console hidden', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Portal Tim & Dapur/i }));
    fireEvent.click(screen.getByRole('button', { name: /Admin/i }));
    fireEvent.change(screen.getByLabelText(/Masukkan PIN Akses/i), { target: { value: '2233' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard/i }));
    expect(await screen.findByText(/Pusat Kendali/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pengaturan Bisnis/i })).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
  });

  it('gates Staff & Developer dashboards behind PIN authentication and enforces role scope', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Login Portal Tim & Dapur/i }));
    expect(screen.getByText('Portal Akses Tim & Pengembang')).toBeInTheDocument();

    // Wrong PIN shows error
    fireEvent.change(screen.getByLabelText(/Masukkan PIN Akses/i), { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard/i }));
    expect(await screen.findByText(/PIN akses tidak valid/i)).toBeInTheDocument();

    // Correct Kitchen PIN opens Kitchen Command Center
    fireEvent.change(screen.getByLabelText(/Masukkan PIN Akses/i), { target: { value: '1122' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard/i }));
    expect(await screen.findByText('Kitchen Command Center')).toBeInTheDocument();
    expect(screen.queryByText('Pengaturan Sistem & Kustomisasi Pengembang')).not.toBeInTheDocument();
  });

  it('unlocks Developer-Only Console via Ctrl+Shift+D and Developer PIN', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    expect(screen.getByText('Portal Akses Tim & Pengembang')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Masukkan PIN Akses/i), { target: { value: '9900' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk Dashboard/i }));
    expect(await screen.findByText('Pengaturan Sistem & Kustomisasi Pengembang')).toBeInTheDocument();
    expect(screen.getByText('Theme & Design Token Customizer')).toBeInTheDocument();
  });
});
