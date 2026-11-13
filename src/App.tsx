import { useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PricingTab } from './components/PricingTab';
import { ProductTab } from './components/ProductTab';
import { UpgradeModal } from './components/UpgradeModal';
import { WorkspaceTab } from './components/WorkspaceTab';
import {
  FirmPlan,
  PlanId,
  SavedMatter,
  TabId,
  UpgradeModalReason,
} from './types/caseFinder';

const FIRM_NAME = 'Bay Area Tenant Law';

const PLANS: Record<PlanId, FirmPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    badgeLabel: 'Free plan',
    monthlyLimit: 20,
    seats: 1,
  },
  solo: {
    id: 'solo',
    name: 'Solo',
    badgeLabel: 'Solo plan',
    monthlyLimit: 100,
    seats: 1,
  },
  team: {
    id: 'team',
    name: 'Team',
    badgeLabel: 'Team plan',
    monthlyLimit: 300,
    seats: 5,
  },
  legalaid: {
    id: 'legalaid',
    name: 'Legal Aid',
    badgeLabel: 'Legal Aid plan',
    monthlyLimit: 500,
    seats: 10,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('product');
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>('free');
  const [searchesUsed, setSearchesUsed] = useState<number>(0);
  const [savedMatters, setSavedMatters] = useState<SavedMatter[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalReason, setUpgradeModalReason] =
    useState<UpgradeModalReason>('feature-lock');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const currentPlan = PLANS[currentPlanId];

  const handleSelectPlan = (planId: PlanId) => {
    setCurrentPlanId(planId);
    setActiveTab('workspace');
  };

  const handleSaveMatter = (matter: SavedMatter) => {
    setSavedMatters((prev) => [matter, ...prev]);
  };

  const handleIncrementUsage = () => {
    setSearchesUsed((prev) => Math.min(currentPlan.monthlyLimit, prev + 1));
  };

  const handleOpenUpgradeModal = (reason: UpgradeModalReason) => {
    setUpgradeModalReason(reason);
    setUpgradeModalOpen(true);
  };

  const handleConfirmTeamUpgrade = () => {
    setCurrentPlanId('team');
  };

  const handleResetDemo = () => {
    setCurrentPlanId('free');
    setSavedMatters([]);
    setSearchesUsed(0);
    setUpgradeModalOpen(false);
    setResetSignal((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'product' && (
          <ProductTab
            onStartTrial={() => setActiveTab('workspace')}
            onViewPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspaceTab
            firmName={FIRM_NAME}
            currentPlan={currentPlan}
            searchesUsed={searchesUsed}
            onIncrementUsage={handleIncrementUsage}
            savedMatters={savedMatters}
            onSaveMatter={handleSaveMatter}
            onOpenUpgradeModal={handleOpenUpgradeModal}
            resetSignal={resetSignal}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            currentPlanId={currentPlanId}
            onSelectPlan={handleSelectPlan}
            onOpenTeamUpgrade={() => handleOpenUpgradeModal('feature-lock')}
          />
        )}
      </main>

      <Footer onResetDemo={handleResetDemo} />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        reason={upgradeModalReason}
        firmName={FIRM_NAME}
        onClose={() => setUpgradeModalOpen(false)}
        onConfirmUpgrade={handleConfirmTeamUpgrade}
      />
    </div>
  );
}
