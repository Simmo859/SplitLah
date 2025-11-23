import React, { useState } from 'react';
import { ReceiptItem, Person } from '../types';
import { Check, Users, UserPlus } from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  items: ReceiptItem[];
  people: Person[];
  onAssign: (itemId: string, personId: string) => void;
  onAddPerson: (name: string) => void;
}

export const ItemAssigner: React.FC<Props> = ({ items, people, onAssign, onAddPerson }) => {
  const [newPersonName, setNewPersonName] = useState('');
  const [isAddingPerson, setIsAddingPerson] = useState(false);

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      onAddPerson(newPersonName.trim());
      setNewPersonName('');
      setIsAddingPerson(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* People Manager */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {people.map((person) => (
          <div key={person.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: person.color }}></div>
             <span className="text-sm font-medium">{person.name}</span>
          </div>
        ))}
        {isAddingPerson ? (
           <div className="flex items-center gap-2">
             <input 
               autoFocus
               type="text" 
               className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Name"
               value={newPersonName}
               onChange={(e) => setNewPersonName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
             />
             <button onClick={handleAddPerson} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={16}/></button>
           </div>
        ) : (
          <button 
            onClick={() => setIsAddingPerson(true)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <UserPlus size={14} />
            <span className="text-xs font-medium">Add Person</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Tap name to toggle assignment</h3>
            <span className="text-xs text-slate-500">{items.length} Items</span>
        </div>
        <div className="divide-y divide-slate-100">
            {items.map((item) => (
                <div key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="font-semibold text-slate-900">${item.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {people.map((person) => {
                            const isSelected = item.assignedTo.includes(person.id);
                            return (
                                <button
                                    key={person.id}
                                    onClick={() => onAssign(item.id, person.id)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                                        ${isSelected 
                                            ? `bg-opacity-10 border-opacity-50` 
                                            : 'bg-white border-slate-200 text-slate-400 grayscale'}
                                    `}
                                    style={{
                                        backgroundColor: isSelected ? person.color + '20' : undefined,
                                        borderColor: isSelected ? person.color : undefined,
                                        color: isSelected ? person.color : undefined
                                    }}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: person.color }}></div>
                                    {person.name}
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                </button>
                            );
                        })}
                         {item.assignedTo.length === 0 && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                                Unassigned
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
