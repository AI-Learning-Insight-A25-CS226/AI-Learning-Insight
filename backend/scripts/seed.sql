insert into users (id, name, email, password) values
  (96989,   'Inggih Wicaksono',       'igihcksn@gmail.com',                     '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (938276,  'Nur Rizki Adi Prasetyo', 'nrizki@dicoding.com',                    '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5021477, 'rifath',                 'rifathali088@gmail.com',                '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5044844, 'LEDIS IDOLA',            '221113142@students.mikroskil.ac.id',    '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5051374, 'Fircan Ferdinand',       'kaslanafircan@gmail.com',               '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5181638, 'Anggit andreansyah',     'anggitandreansyah119@gmail.com',        '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5410562, 'Jeni Amanda',            'jeniamandaa@gmail.com',                 '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC'),
  (5410865, 'ramadhan oktarizaldi',   'roktarizaldi@gmail.com',                '$2b$12$M525sEGvVAaUdDCQiMNW0.iXEVHW066vuy1W/jRC/QOKFp8JVSjSC')
on conflict (id) do nothing;

insert into metrics (
  student_id,
  total_materi_selesai,
  avg_durasi_materi_detik,
  total_review,
  total_hari_aktif,
  std_dev_materi_harian,
  avg_skor_kuis,
  pass_rate_kuis,
  total_kuis_diambil,
  avg_rating_submission,
  total_submissions
)
values
  (96989,   1773, 5914.252115, 442, 111, 22.99129558, 71.45833333, 0.598214286, 336, 2.25862069, 58),
  (938276,  230,  20824.43913, 105, 87,  5.600435314, 84.20224719, 0.831460674, 178, 2.372881356, 59),
  (5021477, 24,   7757.791667, 0,   4,  44.15502991, 85.04761905, 0.857142857, 21, 0,           0),
  (5044844, 262,  8248.305344, 0,   36, 47.31444962, 91.56603774, 0.971698113, 106, 3.833333333, 6),
  (5051374, 141,  5125.432624, 0,   15, 12.7428785,  68.27272727, 0.636363636, 33, 0,           0),
  (5181638, 5,    13.8,        0,    1, 0,           0,          0,           0,  0,           0),
  (5410562, 28,   149.2857143, 0,    1, 0,           93,         1,           5,  0,           0),
  (5410865, 3,    18,          0,    1, 0,           0,          0,           0,  0,           0)
on conflict (student_id) do nothing;