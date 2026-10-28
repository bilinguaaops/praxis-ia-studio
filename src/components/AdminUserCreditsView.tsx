import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingDown,
  Gift,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Clock,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

export interface UserCreditAuditItem {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  creditsOfferts: number;
  creditsAchetes: number;
  creditsConsommes: number;
  soldeActuel: number;
  derniereCorrection: string | null;
  hasDiscrepancy: boolean;
  source?: string;
}

interface AdminUserCreditsViewProps {
  adminToken?: string;
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminUserCreditsView: React.FC<AdminUserCreditsViewProps> = ({
  adminToken,
  onNotify,
}) => {
  const [users, setUsers] = useState<UserCreditAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActiveConsumers, setOnlyActiveConsumers] = useState(false);
  const [sortField, setSortField] = useState<'consommes' | 'createdAt' | 'solde' | 'offerts'>('consommes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getEffectiveToken = () => {
    return adminToken || localStorage.getItem('praxis_admin_token') || localStorage.getItem('cpro_admin_token') || '2345';
  };

  const fetchCreditsData = async () => {
    setIsLoading(true);
    try {
      const token = getEffectiveToken();
      const res = await fetch('/api/admin/users-credits', {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        if (onNotify) onNotify(data.error || 'Erreur lors du chargement des crédits.', 'error');
      }
    } catch {
      if (onNotify) onNotify('Impossible de contacter le serveur d’audit des crédits.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditsData();
  }, []);

  // Filtered & Sorted List
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter consumers
    if (onlyActiveConsumers) {
      result = result.filter((u) => u.creditsConsommes > 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let diff = 0;
      if (sortField === 'consommes') {
        diff = a.creditsConsommes - b.creditsConsommes;
      } else if (sortField === 'solde') {
        diff = a.soldeActuel - b.soldeActuel;
      } else if (sortField === 'offerts') {
        diff = a.creditsOfferts - b.creditsOfferts;
      } else {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    return result;
  }, [users, onlyActiveConsumers, searchQuery, sortField, sortOrder]);

  // Aggregate stats
  const totals = useMemo(() => {
    const totalUsers = users.length;
    const totalOfferts = users.reduce((acc, u) => acc + (u.creditsOfferts || 0), 0);
    const totalAchetes = users.reduce((acc, u) => acc + (u.creditsAchetes || 0), 0);
    const totalConsommes = users.reduce((acc, u) => acc + (u.creditsConsommes || 0), 0);
    const totalSolde = users.reduce((acc, u) => acc + (u.soldeActuel || 0), 0);
    const activeConsumersCount = users.filter((u) => u.creditsConsommes > 0).length;
    const discrepanciesCount = users.filter((u) => u.hasDiscrepancy).length;

    return {
      totalUsers,
      totalOfferts,
      totalAchetes,
      totalConsommes,
      totalSolde,
      activeConsumersCount,
      discrepanciesCount,
    };
  }, [users]);

  // CSV Export
  const exportToCsv = () => {
    const headers = [
      'Email',
      'Nom',
      'Date Inscription',
      'Crédits Offerts',
      'Crédits Achetés',
      'Crédits Consommés',
      'Solde Actuel',
      'Dernière Correction',
      'Intégrité Vérifiée (Solde = Offerts + Achetés - Consommés)',
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.email}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${new Date(u.createdAt).toLocaleDateString('fr-FR')}"`,
      u.creditsOfferts,
      u.creditsAchetes,
      u.creditsConsommes,
      u.soldeActuel,
      u.derniereCorrection ? `"${new Date(u.derniereCorrection).toLocaleDateString('fr-FR')}"` : '"Jamais"',
      u.hasDiscrepancy ? '"ÉCART DÉTECTÉ"' : '"CONFORME"',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `praxis_consommation_credits_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onNotify) onNotify('Fichier CSV exporté avec succès !', 'success');
  };

  const toggleSort = (field: 'consommes' | 'createdAt' | 'solde' | 'offerts') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141C2E] border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Audit & Consommation des Crédits Utilisateurs
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Suivi officiel et auditable de tous les crédits attribués, achetés et consommés par les enseignants inscrits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCreditsData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={exportToCsv}
            disabled={filteredUsers.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Inscrits</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">{totals.totalUsers}</div>
          <div className="text-[10px] text-slate-500">professeurs audités</div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span>Offerts</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {totals.totalOfferts.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500">crédits de bienvenue</div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Achetés</span>
          </div>
          <div className="text-lg font-bold text-blue-400 mt-1">
            {totals.totalAchetes.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500">packs supplémentaires</div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
            <span>Consommés</span>
          </div>
          <div className="text-lg font-bold text-purple-400 mt-1">
            {totals.totalConsommes.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500">{totals.activeConsumersCount} prof(s) actifs</div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Solde restant</span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {totals.totalSolde.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500">en circulation</div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Intégrité</span>
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
            {totals.discrepanciesCount === 0 ? '100% Conforme' : `${totals.discrepanciesCount} Écarts`}
          </div>
          <div className="text-[10px] text-slate-500">solde = off + ach - con</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141C2E] border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par email ou nom..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Checkbox filter only consumers */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyActiveConsumers}
              onChange={(e) => setOnlyActiveConsumers(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <span>Afficher uniquement les utilisateurs ayant consommé (&gt; 0)</span>
          </label>

          <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#141C2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th
                  onClick={() => toggleSort('createdAt')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Inscription</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('offerts')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Offerts</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Achetés</th>
                <th
                  onClick={() => toggleSort('consommes')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1 text-purple-400">
                    <span>Consommés</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('solde')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1 text-amber-400">
                    <span>Solde actuel</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Dernière correction</th>
                <th className="py-3 px-3 text-center">Contrôle Écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Chargement de l'audit des crédits...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Aucun utilisateur trouvé correspondant aux filtres.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>

                    {/* Date inscription */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Crédits offerts */}
                    <td className="py-3 px-3 text-right font-medium">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-mono text-[11px]">
                        +{u.creditsOfferts}
                      </span>
                    </td>

                    {/* Crédits achetés */}
                    <td className="py-3 px-3 text-right font-medium">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/50 font-mono text-[11px]">
                        +{u.creditsAchetes}
                      </span>
                    </td>

                    {/* Crédits consommés */}
                    <td className="py-3 px-3 text-right">
                      {u.creditsConsommes > 0 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/60 font-bold font-mono text-xs">
                          {u.creditsConsommes}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">0</span>
                      )}
                    </td>

                    {/* Solde actuel */}
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold font-mono text-xs">
                        {u.soldeActuel}
                      </span>
                    </td>

                    {/* Dernière correction */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {u.derniereCorrection && u.creditsConsommes > 0 ? (
                        new Date(u.derniereCorrection).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Contrôle intégrité */}
                    <td className="py-3 px-3 text-center">
                      {!u.hasDiscrepancy ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Exact</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-950/70 px-2 py-0.5 rounded-full font-mono font-bold">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>Écart</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
