const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('public/images/products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  {
    filename: 'signature-bloom-bouquet.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDav_O45gjEQWO-k6z_9swXXXlQEsjIT2wCJ3aifgmiN-SU2CxFPOhkkBWOhARIG0SUTkdL34f5MpEkpS_DHsj-Hzcm5uySjYgGDXYKaG2YGUy37E99c72arjiVkHZC0nxlpXQ52bosK2cQA_CRb70KX0edJfFue62dvERhEr5DeHwjmP8Xdhthez21bUJ9Vl5fbd4ChFC6UpGWKW4BdA3AB6UHkgCk8fxCq_EnTiApHuiLDfMNDkVYyg',
  },
  {
    filename: 'mini-pastel-bouquet.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaRQGT5apKfaxifpmS7gJOxVbhfeJD0I1z4pc_JIo4WJ7StHc3ky6x3HvRRuRm68cWzzHOiE-Z3VeGX31BqNk2E7uYD_aFGEeEr4OPUXDGYqiXueUAWZiLwEOhNxT7pTADpfwSCEPRkJFR1m5pnIQ8pOF0rPkwiqy5lLbj24DdIRbj_wgZrPf8PNwfYwmuKp4b2j7lOHAQIiL98tjFJvRFoqit-qkG9gXJ4xgzuZwrSJ1gF57ZHg2SNA',
  },
  {
    filename: 'handmade-tulip.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTfLmX5Iph74QZuIMVgnbGK9aj1RicB-SvHgDa8DYk4VCGMvbRQ4z37A6xPwRVs8O6wgECG3pUOgNjgHvjFLInt5PFeSl0eKJNf4dBM25rGWTRk6E445MeTHK8y18Mtsrn7lAHy1PAgseIIO1kR7Wqpe0XkKlzBk9HxdZMEEfdART3f81kC-F4P4Tzf9y0ff1IrtMEhonA_0Woj06xqxHm5uBVhw9i_3osBF5nMW0nvoTzq9HrKCTZ8Q',
  },
  {
    filename: 'blue-daisy-bloom.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0R29j_PtTkOkVH-qV_rP_RV-5um4zVJLPHAS37jCuJ8T7VRBKCRGk6sbxD298s6Q2m0qFEShW32jBfqOlkV5GtKnyDwqu85m6YUQhehvrPlW1F_FSHZG9fBMbYoec1Kk_jEFUyhISGaTTbnMrVnrgGNH5-YEzS3_28MQsXQGo36cMNAX0uP_BFvmv8WXykWXOvBKj81GAbkEpd9oy3Mxj3xWu9fXihcHGrFt74nTssNvLK0if2GTg',
  },
  {
    filename: 'lavender-bloom-keyring.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg3kj2d9CV_JznG3wdaumYFO3Gyoqqm8WanVM8GMjmtQ-XZ79XEDh2GNwW9nk1q5NdJJcK1GKelknmWcuvTBP_4p3pH9BzvE5unGUJMGq8EYSPCD34Tl_2vbJht39rCXhUlCa_bJVg5eqeinq0L2SUwbJqL9I0_bYAQ3VGfdfNVW2aGwHfKnREWoSfQ20l7sIshk5UP31EZJBXcVzktK9-bN4KOsyteY74h6zbBjWPJ_F68ytMJuzMCA',
  },
  {
    filename: 'mini-tulip-keyring.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPClQM1RihHRk7vFLaW5w6bO4IFtsc3YSzvhllR29iOTvQLNmv471mS4_sb3zwoACtXNV-aIyz1Qo2Oh3U6mtc9SUKU072KkT1rykTN6DohHAwkDsXaGH6cMlzhxu3yy7_3QVDEPVL9qEV5cHyuS_ls2HbxoiuzWwD4KMcaZqvIMdsV2WnFhsIRAedDl1yuOQvAR7Ec-qzgiiEk9dsXKnw-sZAzo8z_EospqYIB9xBWpEO4NY_jjcp8A',
  },
  {
    filename: 'butterfly-bloom-charm.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg3kj2d9CV_JznG3wdaumYFO3Gyoqqm8WanVM8GMjmtQ-XZ79XEDh2GNwW9nk1q5NdJJcK1GKelknmWcuvTBP_4p3pH9BzvE5unGUJMGq8EYSPCD34Tl_2vbJht39rCXhUlCa_bJVg5eqeinq0L2SUwbJqL9I0_bYAQ3VGfdfNVW2aGwHfKnREWoSfQ20l7sIshk5UP31EZJBXcVzktK9-bN4KOsyteY74h6zbBjWPJ_F68ytMJuzMCA',
  },
  {
    filename: 'daisy-bag-charm.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5mBLGf4SEZDjLtgrgm7x_ffcfVzGeoulGFlhKNN1AGAuHN9MoAcnWpJkB54F34q19AMLDIOeUsVX47tGgaq3UJWwNq58muhgp1HiSujhSSWAS7CY0-3yIJkAUnab4XxM8MU_QTxkqZHPbVdXRYFj2oxGF-yiaBRd0fw5Vr5gRD4116jHEPZsWye5P0IQB6H28sj54IHz8Gjf5WYUbGH5UIvZ4rUbaFiTfJTvRTzZsYkrzygWD_et0A',
  },
  {
    filename: 'mini-bloom-gift-set.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUjwXEP7FjEAWQk94f54Zu1MWlP_cOs9KK-zMLhi3qkwDjGa5uE2p_2tNQwwh-irx_2CcWxZJeY2yqAxhy1YvX7UYAs5AbPPat38QrRNSQF7pLa6AGEbHat7Acvlw2Lzd-mXLz1H-J1xGkVS-nIly6U2onbEw_e09YX5ek2xn45TiQ0zk0-ZEC_aOEOcD_7UmyphNYyVgzm-0F6RLHTMn8yTLafetmztkj7YPquKbbj5FnSZvbmqvcNA',
  },
  {
    filename: 'best-friend-gift-box.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL_IbJJSjVi5XsOV7ycJx-BZ3BTgeBlqNMGULJ1FB_3GZi4NrcDwwa3c25jaa04hJJ_PFk8Ks3CJ13z3d6ZHg8cBaMB_HbaUu7Wz1rPqGHK5W-2FdCtwLOgUlKYgpebDcNQd4cceWiz0qs26a2n8Zfxh8TuV7QWMo6ejWJgyEeki0AcVcAgqar3BDCsFzIhPeQ6IgQ_x6AfC4TLVbIrY76C4ohTtdt5VpPonDycFMmUK3EU0oqTUAnQg',
  },
  {
    filename: 'rose-bloom-bouquet.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF9LhK-DWgkD9o8NazAGe8Q6PaRGefjofA0MkhbbdF-K2os5R11RLbDk_miN0OFMMTEW17weEAuecp-U9fTIIfvMDw9Z3HJpGCvhaLT0dkqMjuZ3KFQUUepvscUCi1kATvfsErjVLezdcecmI1u_eVw9vAH5PcT3uJB8psszJEcE_ZlKO1DByuqhlkPkX4UNJj_VgSzEXxYXI5Ex3hsANVQocWWPJJ1wuEOidiZqogSYc6hB9FcKxE2g',
  },
  {
    filename: 'pastel-flower-charm-set.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoXI2VDg9ZxSUCdPEssVZYiojmRQOj7zh3YaowT2JtSJ3RBaK8XCdiZmW_wfyL4_6k5WT8Fc670u7u550cG_fuPVcIAgMBwZuH-3ktWAl8ZcUbOKWCYjg4wmXczzLJ3HILYMkdBymJPQ5_ajwVQbNiH6Z7gnZQK-ADBEFbrLR1rWZp5Rx0AiRy6D-fZCbpvKoTnIWTzRL2i3WJuIO7nptd3p2u_xmU7yOPZA8Jqxd4DcBClZwJCgqrmw',
  },
];

for (const item of images) {
  const dest = path.join(targetDir, item.filename);
  console.log(`Downloading ${item.filename}...`);
  try {
    execSync(`curl.exe -s -L -o "${dest}" "${item.url}"`);
    const size = fs.statSync(dest).size;
    console.log(`Saved ${item.filename} (${size} bytes)`);
  } catch (err) {
    console.error(`Failed ${item.filename}`, err);
  }
}
