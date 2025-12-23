import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-[#0068B3] to-[#3CAADF] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-8 h-8 text-[#FFB81C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Content Synthesizer
              </h1>
              <p className="text-sm text-blue-100">
                Personalized Health Reports & Affiliate Links
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100">Powered by</p>
            <p className="font-semibold">
              <span className="text-[#3CAADF]">Daily with </span>
              <span className="text-white">Doc</span>
              <span className="text-[#F58A34]"> & Becca</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
