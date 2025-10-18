import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash,
  Search,
  Edit,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const STORAGE_KEY = "mahasiswa_data_v3";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Student {
  id: string;
  nama: string;
  nim: string;
  jurusan: string;
  angkatan: string;
}

const initialStudents: Student[] = [
  {
    id: uid(),
    nama: "Wiki Nurrohman",
    nim: "1217050140",
    jurusan: "Teknik Informatika",
    angkatan: "2021",
  },
  {
    id: uid(),
    nama: "Alya Rahma",
    nim: "210301001",
    jurusan: "Teknik Informatika",
    angkatan: "2021",
  },
  {
    id: uid(),
    nama: "Bima Santoso",
    nim: "210301002",
    jurusan: "Sistem Informasi",
    angkatan: "2022",
  },
];

export default function MahasiswaApp() {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : initialStudents;
    } catch {
      return initialStudents;
    }
  });

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Student | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    nim: "",
    jurusan: "",
    angkatan: "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number | "all">(10);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  function resetForm() {
    setForm({ nama: "", nim: "", jurusan: "", angkatan: "" });
    setEditing(null);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { nama, nim, jurusan, angkatan } = form;
    if (!nama.trim() || !nim.trim() || !jurusan.trim() || !angkatan.trim()) {
      return alert("Semua field wajib diisi!");
    }

    const isDuplicate = students.some(
      (s: Student) => s.nim === nim && s.id !== editing
    );
    if (isDuplicate) return alert("NIM sudah terdaftar!");

    if (editing) {
      setStudents((s) =>
        s
          .map((st) => (st.id === editing ? { ...st, ...form } : st))
          .sort((a, b) => a.nim.localeCompare(b.nim))
      );
    } else {
      setStudents((s) =>
        [...s, { id: uid(), ...form }].sort((a, b) =>
          a.nim.localeCompare(b.nim)
        )
      );
    }
    resetForm();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus data mahasiswa ini?")) return;
    setStudents((s) => s.filter((st) => st.id !== id));
  }

  function startEdit(student: Student) {
    setEditing(student.id);
    setForm({
      nama: student.nama,
      nim: student.nim,
      jurusan: student.jurusan,
      angkatan: student.angkatan,
    });
    setShowForm(true);
  }

  const filtered = students
    .filter((s) => {
      const q = query.toLowerCase().trim();
      if (!q) return true;
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.jurusan.toLowerCase().includes(q) ||
        s.angkatan.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nim.localeCompare(b.nim));

  // Pagination
  const totalPages =
    perPage === "all" ? 1 : Math.ceil(filtered.length / perPage);
  const startIdx = perPage === "all" ? 0 : (page - 1) * perPage;
  const paginated =
    perPage === "all" ? filtered : filtered.slice(startIdx, startIdx + perPage);

  // EXPORT CSV
  function exportCSV() {
    const csvHeader = ["Nama", "NIM", "Jurusan", "Angkatan"];
    const csvRows = students.map((s) =>
      [s.nama, s.nim, s.jurusan, s.angkatan].join(",")
    );
    const csvContent = [csvHeader.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mahasiswa.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // IMPORT CSV
  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [, ...rows] = lines;
      const data = rows.map((line) => {
        const [nama, nim, jurusan, angkatan] = line.split(",");
        return { id: uid(), nama, nim, jurusan, angkatan };
      });

      setStudents((s) => {
        const combined = [...s];
        for (const d of data) {
          if (!combined.some((x) => x.nim === d.nim)) {
            combined.push(d);
          }
        }
        return combined.sort((a, b) => a.nim.localeCompare(b.nim));
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Manajemen Mahasiswa
            </h1>
            <p className="text-gray-500 mt-1">
              Tambah, Lihat, Edit, dan Hapus data mahasiswa dengan mudah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, NIM, jurusan..."
                className="pl-9 pr-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 outline-none"
              />
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <Download className="w-4 h-4" /> Ekspor
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer">
              <Upload className="w-4 h-4" /> Impor
              <input
                type="file"
                accept=".csv"
                onChange={importCSV}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </header>

        {/* Table */}
        <main>
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left">No</th>
                  <th className="py-3 px-4 text-left">Nama</th>
                  <th className="py-3 px-4 text-left">NIM</th>
                  <th className="py-3 px-4 text-left">Jurusan</th>
                  <th className="py-3 px-4 text-left">Angkatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((m: Student, idx: number) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-2 px-4">{startIdx + idx + 1}</td>
                      <td className="py-2 px-4">{m.nama}</td>
                      <td className="py-2 px-4">{m.nim}</td>
                      <td className="py-2 px-4">{m.jurusan}</td>
                      <td className="py-2 px-4">{m.angkatan}</td>
                      <td className="py-2 px-4 text-right space-x-2">
                        <button
                          onClick={() => setShowDetail(m)}
                          className="p-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-500 border-t">
                Tidak ada data yang cocok.
              </div>
            )}
          </section>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={perPage}
                onChange={(e) => {
                  const val =
                    e.target.value === "all" ? "all" : Number(e.target.value);
                  setPerPage(val);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white"
              >
                <option value={10}>1–10</option>
                <option value={20}>1–20</option>
                <option value={50}>1–50</option>
                <option value="all">Semua</option>
              </select>

              <span>dari {filtered.length} data</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg border ${
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <span>
                Halaman {page} / {totalPages || 1}
              </span>
              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg border ${
                  page === totalPages || totalPages === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Modal Detail */}
        <AnimatePresence>
          {showDetail && (
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6"
              >
                <h2 className="text-lg font-semibold mb-4 text-center">
                  Detail Mahasiswa
                </h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Nama:</strong> {showDetail.nama}
                  </p>
                  <p>
                    <strong>NIM:</strong> {showDetail.nim}
                  </p>
                  <p>
                    <strong>Jurusan:</strong> {showDetail.jurusan}
                  </p>
                  <p>
                    <strong>Angkatan:</strong> {showDetail.angkatan}
                  </p>
                </div>
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowDetail(null)}
                    className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6"
              >
                <h2 className="text-lg font-semibold mb-4">
                  {editing ? "Edit Mahasiswa" : "Tambah Mahasiswa"}
                </h2>

                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Nama
                    </label>
                    <input
                      value={form.nama}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nama: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-inner focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        NIM
                      </label>
                      <input
                        value={form.nim}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nim: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Angkatan
                      </label>
                      <input
                        value={form.angkatan}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            angkatan: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-inner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Jurusan
                    </label>
                    <input
                      value={form.jurusan}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, jurusan: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-inner"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {editing ? "Simpan Perubahan" : "Tambah"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
