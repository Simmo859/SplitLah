import React, { useState } from 'react';
import { ReceiptData, Person, BillState, ReceiptItem } from './types';
import { ReceiptUploader } from './components/ReceiptUploader';
import { ItemAssigner } from './components/ItemAssigner';
import { Summary } from './components/Summary';
import { VoiceControl } from './components/VoiceControl';
import { parseReceiptImage, processVoiceCommand } from './services/geminiService';
import { INITIAL_PEOPLE, COLORS } from './constants';
import { AlertCircle, ChevronLeft, RotateCw } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<BillState>({
    step: 'upload',
    receiptImage: null,
    rawReceiptData: null,
    people: INITIAL_PEOPLE,
    hostPersonId: 'p1',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  const handleImageSelected = async (base64: string) => {
    setState(prev => ({ ...prev, step: 'analyzing', receiptImage: base64 }));
    setError(null);

    try {
      const data = await parseReceiptImage(base64);
      
      // Transform raw items to add IDs and empty assignments
      const itemsWithIds: ReceiptItem[] = data.items.map((item: any, idx: number) => ({
        ...item,
        id: `item-${idx}`,
        assignedTo: []
      }));

      setState(prev => ({
        ...prev,
        step: 'assign',
        rawReceiptData: { ...data, items: itemsWithIds }
      }));
    } catch (err) {
      setError("Failed to analyze receipt. Please try a clearer photo.");
      setState(prev => ({ ...prev, step: 'upload' }));
    }
  };

  const handleAssign = (itemId: string, personId: string) => {
    if (!state.rawReceiptData) return;

    const updatedItems = state.rawReceiptData.items.map(item => {
      if (item.id === itemId) {
        const currentAssignment = item.assignedTo;
        const isAssigned = currentAssignment.includes(personId);
        
        return {
          ...item,
          assignedTo: isAssigned 
            ? currentAssignment.filter(id => id !== personId)
            : [...currentAssignment, personId]
        };
      }
      return item;
    });

    setState(prev => ({
      ...prev,
      rawReceiptData: {
        ...prev.rawReceiptData!,
        items: updatedItems
      }
    }));
  };

  const handleAddPerson = (name: string) => {
    const newId = `p${state.people.length + 1}`;
    const newColor = COLORS[state.people.length % COLORS.length];
    
    setState(prev => ({
      ...prev,
      people: [...prev.people, { id: newId, name, color: newColor }]
    }));
  };

  const handleVoiceCommand = async (audioBase64: string) => {
    if (!state.rawReceiptData) return;
    
    setIsVoiceProcessing(true);
    setError(null);

    try {
      const result = await processVoiceCommand(
        state.rawReceiptData.items,
        state.people,
        audioBase64
      );

      const updatedItems = state.rawReceiptData.items.map(item => {
        const update = result.updates.find(u => u.itemId === item.id);
        if (update) {
          return { ...item, assignedTo: update.assignedTo };
        }
        return item;
      });

      setState(prev => ({
        ...prev,
        rawReceiptData: {
          ...prev.rawReceiptData!,
          items: updatedItems
        }
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to process voice command. Please try again.");
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden min-h-screen">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            {state.step !== 'upload' && (
                <button 
                    onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Splitlah
            </h1>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">
            SG Beta
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        
        {/* Error Banner */}
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {/* View: Upload */}
        {state.step === 'upload' && (
            <div className="space-y-6 mt-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Split bills instantly</h2>
                    <p className="text-slate-500">Upload a receipt to get started. We handle GST & Service Charge automatically.</p>
                </div>
                <ReceiptUploader 
                    onImageSelected={handleImageSelected} 
                    isProcessing={false} 
                />
                
                {/* Instructions */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <h3 className="font-semibold text-slate-700">How it works</h3>
                    <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex gap-2">
                            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Upload photo of bill
                        </li>
                        <li className="flex gap-2">
                            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Assign items to friends
                        </li>
                        <li className="flex gap-2">
                            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            Share PayNow details via WhatsApp
                        </li>
                    </ul>
                </div>
            </div>
        )}

        {/* View: Analyzing */}
        {state.step === 'analyzing' && (
             <div className="flex flex-col items-center justify-center h-full space-y-6 mt-20">
                <RotateCw className="animate-spin text-blue-600" size={48} />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-800">Reading Receipt...</h3>
                    <p className="text-slate-500 text-sm">Identifying items, GST, and Service Charge</p>
                </div>
             </div>
        )}

        {/* View: Assignment */}
        {state.step === 'assign' && state.rawReceiptData && (
            <div className="space-y-6 pb-24">
                 <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{state.rawReceiptData.merchantName}</h2>
                        <p className="text-slate-500 text-sm">{state.rawReceiptData.date}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</p>
                         <p className="text-xl font-bold text-blue-600">${state.rawReceiptData.total.toFixed(2)}</p>
                    </div>
                 </div>

                 <ItemAssigner 
                    items={state.rawReceiptData.items}
                    people={state.people}
                    onAssign={handleAssign}
                    onAddPerson={handleAddPerson}
                 />
            </div>
        )}

        {/* View: Summary */}
        {state.step === 'summary' && state.rawReceiptData && (
            <Summary 
                receiptData={state.rawReceiptData}
                people={state.people}
                hostId={state.hostPersonId}
            />
        )}

      </main>

      {/* Footer / Persistent Actions */}
      {state.step === 'assign' && (
        <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-center mb-4">
                 <span className="text-sm text-slate-600">
                     {state.rawReceiptData?.items.filter(i => i.assignedTo.length === 0).length} items unassigned
                 </span>
                 <VoiceControl 
                    onVoiceCommand={handleVoiceCommand}
                    isProcessing={isVoiceProcessing}
                 />
             </div>
             <button 
                onClick={() => setState(prev => ({ ...prev, step: 'summary' }))}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
             >
                Calculate Split
             </button>
        </div>
      )}
    </div>
  );
};

export default App;