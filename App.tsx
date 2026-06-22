import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { generateColoringPage, ColoringPageResult, getSavedGeminiApiKey, saveGeminiApiKey } from './services/geminiService';
import { AppState } from './types';
import { RefreshCw, Download, Trash2, Edit2, ScanLine, Type, Eraser, Sparkles, MessageSquarePlus, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // State to store all versions
  const [results, setResults] = useState<ColoringPageResult | null>(null);
  // State to track which version is currently being viewed
  const [viewMode, setViewMode] = useState<'withText' | 'withoutText' | 'cleanedUp'>('withText');
  
  // User custom instructions
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => getSavedGeminiApiKey());
  
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
    setAppState(AppState.PREVIEW);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setAppState(AppState.GENERATING);
    setError(null);

    try {
      saveGeminiApiKey(geminiApiKey);
      const resultData = await generateColoringPage(originalImage, 'image/jpeg', customInstruction);
      setResults(resultData);
      setViewMode('cleanedUp'); // Default to the guide version
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate the coloring page. Please try again with a different image or simpler sketch.");
      setAppState(AppState.PREVIEW);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResults(null);
    setCustomInstruction('');
    setAppState(AppState.UPLOAD);
    setError(null);
  };

  const handleDownload = () => {
    if (!results) return;
    const currentImage = results[viewMode];
    if (!currentImage) return;

    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `coloring-page-${viewMode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentGeneratedImage = results ? results[viewMode] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        
        {/* Error Message */}
        {error && (
          <div className="w-full max-w-2xl bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-8 flex items-center justify-between animate-fade-in">
             <span>{error}</span>
             <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">&times;</button>
          </div>
        )}

        {/* State: Upload */}
        {appState === AppState.UPLOAD && (
          <div className="w-full animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                Digitize Sketches into <span className="text-indigo-600">Coloring Pages</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload your drawings. We'll automatically flatten the image, remove the background, and give you professional coloring book pages.
              </p>
            </div>
            <ImageUploader onImageSelect={handleImageSelect} />
          </div>
        )}

        {/* State: Preview */}
        {appState === AppState.PREVIEW && originalImage && (
          <div className="w-full max-w-4xl animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Preview Upload</h3>
                <button 
                  onClick={handleReset}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove image"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <div className="p-8 flex flex-col md:flex-row items-start justify-center gap-8">
                <div className="relative group w-full max-w-md aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                  <img 
                    src={originalImage} 
                    alt="Original Sketch" 
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                </div>
                
                <div className="flex flex-col gap-6 w-full max-w-sm">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">Ready to Digitize?</h4>
                    <p className="text-slate-500 text-sm">We'll create 3 variations: Exact Trace, Text Removed, and Guide Mode.</p>
                  </div>

                  <div className="w-full">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <MessageSquarePlus size={16} className="text-indigo-500"/>
                      Optional Instructions
                    </label>
                    <textarea
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      placeholder="e.g., Isolate the main subject, Remove the background people, Make outlines thicker..."
                      className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-slate-50/50 hover:bg-white transition-all placeholder:text-slate-400"
                      rows={3}
                    />
                  </div>

                  <div className="w-full">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <KeyRound size={16} className="text-indigo-500"/>
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Needed for GitHub Pages demos"
                      autoComplete="off"
                      className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50/50 hover:bg-white transition-all placeholder:text-slate-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Stored only in this browser. GitHub Pages is static, so this keeps demo keys out of the public bundle.
                    </p>
                  </div>
                  
                  <div className="flex flex-col w-full gap-3">
                    <Button onClick={handleGenerate} className="w-full shadow-indigo-200 shadow-lg" icon={<ScanLine />}>
                      Digitize & Convert
                    </Button>
                    <Button variant="ghost" onClick={handleReset} className="w-full">
                      Choose different image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: Generating */}
        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Spinner />
            <div className="mt-8 text-center space-y-2">
               <h3 className="text-xl font-bold text-slate-800">Digitizing your sketch...</h3>
               <p className="text-slate-500">Processing variations based on your instructions...</p>
            </div>
          </div>
        )}

        {/* State: Result */}
        {appState === AppState.RESULT && currentGeneratedImage && originalImage && (
          <div className="w-full max-w-6xl animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Your Coloring Page</h2>
                <p className="text-slate-500">Select your preferred style below.</p>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" onClick={handleReset} icon={<RefreshCw size={16}/>}> 
                   New Scan
                 </Button>
                 <Button onClick={handleDownload} icon={<Download size={16}/>}> 
                   Download Image
                 </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Original Card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col order-2 md:order-1">
                <div className="mb-3 px-1 flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original</span>
                </div>
                <div className="bg-slate-100 rounded-xl overflow-hidden flex-grow relative aspect-[4/5] md:aspect-square">
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain p-4 mix-blend-multiply" 
                  />
                </div>
              </div>

              {/* Result Card */}
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-indigo-100 flex flex-col ring-4 ring-indigo-50/50 order-1 md:order-2">
                <div className="mb-4 flex p-1 bg-slate-100 rounded-lg gap-1">
                  <button
                    onClick={() => setViewMode('withText')}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                      viewMode === 'withText' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Type size={16} />
                    <span>Exact Trace</span>
                  </button>
                  <button
                    onClick={() => setViewMode('withoutText')}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                      viewMode === 'withoutText' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Eraser size={16} />
                    <span>Remove Text</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cleanedUp')}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                      viewMode === 'cleanedUp' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Sparkles size={16} />
                    <span>Grey Guide</span>
                  </button>
                </div>
                
                <div className="bg-white rounded-xl overflow-hidden flex-grow relative aspect-[4/5] md:aspect-square border border-slate-100 group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
                  <img 
                    src={currentGeneratedImage} 
                    alt="Generated Coloring Page" 
                    className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Sketch to Color. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;