import React from 'react';
import { Home, Image, FileText, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'procesar-tiff', label: 'Procesar TIFF', icon: Image },
    { id: 'convertir-pdf', label: 'Convertir PDF', icon: FileText },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'ayuda', label: 'Ayuda', icon: HelpCircle },
  ];

  return (
    <div className="w-80 bg-gradient-to-b from-red-800 to-red-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Image className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Procesador de</h1>
            <h1 className="text-xl font-bold">Imagenes</h1>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium mb-4 opacity-75">MENÚ</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-red-700 bg-opacity-60'
                      : 'hover:bg-red-700 hover:bg-opacity-40'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 text-sm opacity-75">
        <p>Versión 1.0.0 BY Uriel Carmona</p>
      </div>
    </div>
  );
}