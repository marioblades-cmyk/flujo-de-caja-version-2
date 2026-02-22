import { Link } from "react-router-dom";
import { useCashFlow } from "@/hooks/useCashFlow";
import OpenCashForm from "@/components/OpenCashForm";
import ActiveShiftView from "@/components/ActiveShiftView";
import ShiftHistory from "@/components/ShiftHistory";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, History } from "lucide-react";

const Index = () => {
  const {
    currentShift,
    shifts,
    lastClosedShift,
    currentBalance,
    openCash,
    addTransaction,
    closeCash,
    updateTransaction,
    deleteTransaction,
    updateShift,
    getShiftFinalBalance,
    loading,
  } = useCashFlow();

  const lastFinalBalance = lastClosedShift
    ? getShiftFinalBalance(lastClosedShift)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-display tracking-wider text-foreground leading-none">
              FLUJO DE CAJA
            </h1>
            <p className="text-sm text-muted-foreground">Tienda de Mangas & Comics</p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/historial">
              <History className="w-4 h-4" /> Historial
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentShift ? (
          <ActiveShiftView
            shift={currentShift}
            currentBalance={currentBalance!}
            onAddTransaction={addTransaction}
            onClose={closeCash}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onUpdateShift={updateShift}
          />
        ) : (
          <OpenCashForm
            lastClosedShift={lastClosedShift}
            lastFinalBalance={lastFinalBalance}
            onOpen={openCash}
          />
        )}

        <ShiftHistory shifts={shifts} getShiftFinalBalance={getShiftFinalBalance} />
      </main>
    </div>
  );
};

export default Index;
