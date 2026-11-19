import { z } from 'zod';
import { getPasswordPolicyError } from '../shared/passwordPolicy.js';
import { ROLES } from '../shared/rbac.js';

const StaffRoleEnum = z.enum([ROLES.KITCHEN, ROLES.ADMIN, ROLES.DEVELOPER]);

const StrongPasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password terlalu panjang')
  .superRefine((val, ctx) => {
    const err = getPasswordPolicyError(val);
    if (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
    }
  });

export const LoginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Masukkan email atau username').max(120).optional(),
    password: z.string().min(4, 'Password wajib diisi').max(72).optional(),
    role: StaffRoleEnum.optional(),
    pin: z.string().trim().min(4).max(72).optional(),
    rememberMe: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const hasAccountCreds = Boolean(data.identifier && data.password);
    const hasLegacyCreds = Boolean(data.role && (data.pin || data.password));
    if (!hasAccountCreds && !hasLegacyCreds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email/username dan password wajib diisi.',
        path: ['identifier'],
      });
    }
  });

export const ForgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3, 'Masukkan email atau username akun').max(120),
  role: StaffRoleEnum.optional(),
});

export const VerifyResetCodeSchema = z.object({
  identifier: z.string().trim().min(3, 'Identifier wajib diisi').max(120),
  code: z.string().trim().regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka'),
});

export const ResetPasswordSchema = z
  .object({
    method: z.enum(['otp', 'recovery_key']),
    identifier: z.string().trim().min(3, 'Masukkan email atau username akun').max(120),
    code: z.string().trim().optional(),
    recoveryKey: z.string().trim().optional(),
    newPassword: StrongPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Konfirmasi password tidak cocok.',
        path: ['confirmPassword'],
      });
    }
    if (data.method === 'otp' && !/^\d{6}$/.test(data.code || '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kode OTP harus terdiri dari 6 digit angka.',
        path: ['code'],
      });
    }
    if (data.method === 'recovery_key' && String(data.recoveryKey || '').trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Master Recovery Key tidak valid.',
        path: ['recoveryKey'],
      });
    }
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(4, 'Password saat ini wajib diisi').max(72),
    newPassword: StrongPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Konfirmasi password tidak cocok.',
        path: ['confirmPassword'],
      });
    }
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password baru harus berbeda dari password saat ini.',
        path: ['newPassword'],
      });
    }
  });

export const RotateRecoveryKeySchema = z.object({
  currentPassword: z.string().min(4, 'Masukkan password Anda untuk verifikasi').max(72),
  targetRole: StaffRoleEnum.optional(),
});

export const DeveloperResetPasswordSchema = z.object({
  newPassword: StrongPasswordSchema,
});

export const CreateOrderSchema = z.object({
  packageId: z.string().trim().min(1),
  pax: z.coerce.number().int().min(1).max(10000),
  stalls: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        pax: z.coerce.number().int().min(10).max(10000),
      })
    )
    .max(20)
    .default([]),
  customerName: z.string().trim().min(2, 'Nama pemesan wajib diisi').max(120),
  whatsapp: z.string().trim().min(8, 'Nomor WhatsApp tidak valid').max(30),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  address: z.string().trim().min(5, 'Alamat lengkap wajib diisi').max(400),
  notes: z.string().trim().max(500).optional().default('Tidak ada catatan tambahan.'),
});

export const ClientNoteSchema = z.object({
  whatsapp: z.string().trim().min(6),
  notes: z.string().trim().min(1, 'Catatan tidak boleh kosong').max(500),
});

export const KitchenStageSchema = z.object({
  kitchenStage: z.enum(['Persiapan Bahan', 'Sedang Dimasak', 'QC & Packing', 'Siap Kirim']),
});

export const OrderAdminPatchSchema = z.object({
  status: z.enum(['Menunggu DP', 'DP Lunas', 'Diproses Dapur', 'Dikirim', 'Selesai']).optional(),
  dpVerified: z.boolean().optional(),
  kitchenStage: z.enum(['Persiapan Bahan', 'Sedang Dimasak', 'QC & Packing', 'Siap Kirim']).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const PackageUpsertSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(120),
  titleLine1: z.string().trim().max(60).optional(),
  titleLine2: z.string().trim().max(60).optional(),
  rankLabel: z.string().trim().max(60).optional().default('#Baru Rilis'),
  category: z.enum(['Prasmanan', 'Nasi Box', 'Tumpeng', 'Snack Box', 'Live Stall']),
  plateStyle: z.enum(['buffet', 'bento', 'tumpeng', 'roast', 'snack']).default('buffet'),
  accentTint: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#064E3B'),
  price: z.coerce.number().int().min(1000).max(5000000),
  hpp: z.coerce.number().int().min(500).max(5000000),
  minOrder: z.coerce.number().int().min(1).max(5000),
  rating: z.string().trim().max(10).optional().default('4.9'),
  chefName: z.string().trim().min(2).max(100).default('Chef Feny Maharani'),
  chefTitle: z.string().trim().max(100).optional().default('Culinary Specialist'),
  chefQuote: z.string().trim().max(500).optional().default('Racikan segar dengan standar mutu Sajian Catering.'),
  servingNote: z.string().trim().max(200).optional().default('Standar porsi sajian lengkap'),
  allergens: z.array(z.string().trim().max(60)).max(15).optional().default([]),
  equipment: z.array(z.string().trim().max(120)).max(15).optional().default([]),
  videoDuration: z.string().trim().max(20).optional().default('02:00'),
  videoHighlights: z.array(z.string().trim().max(140)).max(10).optional().default([]),
  items: z.array(z.string().trim().min(1).max(140)).min(1, 'Minimal 1 item menu').max(30),
  isActive: z.boolean().optional().default(true),
}).refine((d) => d.hpp < d.price, { message: 'HPP harus lebih kecil dari harga jual.', path: ['hpp'] });

export const BusinessSettingsSchema = z.object({
  business: z.object({
    whatsappNumber: z.string().trim().min(8).max(25),
    phoneDisplay: z.string().trim().min(6).max(30),
    email: z.string().trim().email(),
    instagram: z.string().trim().max(60),
    address: z.string().trim().min(5).max(300),
    serviceArea: z.string().trim().min(3).max(200),
    operatingHours: z.string().trim().min(3).max(120),
    bankName: z.string().trim().min(2).max(80),
    bankAccountNumber: z.string().trim().min(4).max(40),
    bankAccountHolder: z.string().trim().min(2).max(120),
    dpPercent: z.coerce.number().int().min(10).max(100),
    dailyMaxPax: z.coerce.number().int().min(50).max(10000),
    minLeadDays: z.coerce.number().int().min(0).max(30),
    blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
    announcementBanner: z.string().trim().max(300),
  }),
  faq: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        question: z.string().trim().min(3).max(240),
        answer: z.string().trim().min(3).max(800),
      })
    )
    .max(30)
    .optional(),
  terms: z.array(z.string().trim().min(3).max(400)).max(30).optional(),
  companyProfile: z
    .object({
      headline: z.string().trim().min(3).max(200),
      summary: z.string().trim().min(10).max(1000),
      metrics: z.array(z.object({ label: z.string(), value: z.string(), detail: z.string() })).max(8),
      certifications: z.array(z.string()).max(12),
    })
    .optional(),
});

export const DeveloperConfigSchema = z.object({
  brand: z
    .object({
      name: z.string().trim().min(2).max(60),
      shortName: z.string().trim().min(2).max(30),
      subName: z.string().trim().min(1).max(30),
      badgeText: z.string().trim().max(40),
      tagline: z.string().trim().max(160),
      orderPrefix: z.string().trim().min(2).max(8).regex(/^[A-Z0-9]+$/),
    })
    .optional(),
  themeTokens: z
    .object({
      presetId: z.string().trim().min(1),
      label: z.string().trim().max(60),
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      primaryDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      radiusScale: z.enum(['sharp', 'rounded', 'pill']),
      reduceMotion: z.boolean(),
    })
    .optional(),
  featureFlags: z
    .object({
      enableClientPortal: z.boolean(),
      enableCatalogFilter: z.boolean(),
      enableVideoPreview: z.boolean(),
      enableTestimonials: z.boolean(),
      enableFaqSection: z.boolean(),
      enableWhatsAppCheckout: z.boolean(),
      enableDemoQuickSwitch: z.boolean(),
    })
    .optional(),
  rolePins: z
    .object({
      kitchen: z.string().trim().min(4).max(32).optional(),
      admin: z.string().trim().min(4).max(32).optional(),
      developer: z.string().trim().min(4).max(32).optional(),
    })
    .optional(),
});
