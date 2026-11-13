import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PricingTab } from './components/PricingTab';
import { ProductTab } from './components/ProductTab';
import { WorkspaceTab } from './components/WorkspaceTab';
import { fetchSavedMatters, persistSavedMatter } from './services/caseFinderApi';
import { FirmPlan, PlanId, SavedMatter, TabId } from './types/caseFinder';

const PLANS: Record<PlanId, FirmPlan> = {
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
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>('team');
  const [searchesUsed, setSearchesUsed] = useState<number>(0);
  const [savedMatters, setSavedMatters] = useState<SavedMatter[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchSavedMatters().then((matters) => {
      if (mounted && matters.length > 0) {
        setSavedMatters(matters);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentPlan = PLANS[currentPlanId];

  const handleSelectPlan = (planId: PlanId) => {
    setCurrentPlanId(planId);
    setActiveTab('workspace');
  };

  const handleSaveMatter = (matter: SavedMatter) => {
    setSavedMatters((prev) => [matter, ...prev]);
    void persistSavedMatter(matter);
  };

  const handleIncrementUsage = () => {
    setSearchesUsed((prev) => Math.min(currentPlan.monthlyLimit, prev + 1));
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
            firmName="Bay Area Tenant Law"
            currentPlan={currentPlan}
            searchesUsed={searchesUsed}
            onIncrementUsage={handleIncrementUsage}
            savedMatters={savedMatters}
            onSaveMatter={handleSaveMatter}
            onGoToPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab currentPlanId={currentPlanId} onSelectPlan={handleSelectPlan} />
        )}
      </main>

      <Footer />
    </div>
  );
}
