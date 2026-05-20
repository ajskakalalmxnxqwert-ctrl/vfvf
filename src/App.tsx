import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Download, Search, AlertCircle, CheckCircle2, ChevronRight, Video, Image as ImageIcon, Smartphone, Lock, Zap, FileVideo } from 'lucide-react';

interface Story {
  id: string;
  mediaUrl: string;
  previewUrl: string | null;
  mediaType: string;
  isM3U8: boolean;
}

interface Profile {
  username: string;
  displayName: string;
  bitmoji: string | null;
  stories: Story[];
}

function DownloaderPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setProfile(null);

    try {
      const res = await fetch('/api/snapchat/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stories.');
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (story: Story) => {
    // Construct the backend download proxy URL
    const downloadUrl = `/api/snapchat/download?url=${encodeURIComponent(story.mediaUrl)}&type=${story.mediaType}&id=${story.id}`;
    
    // Trigger download programmatically
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 bg-[#FFFC00] rounded-lg flex items-center justify-center border border-slate-900">
              <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4 11h-4v4h-2v-4H6v-2h4V7h2v4h4v2z"></path></svg>
            </div>
            <span className="font-bold text-xl tracking-tight">SnapSaver<span className="text-yellow-500 text-xs align-top ml-0.5">PRO</span></span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Downloader</Link>
            <Link to="/snapchat-planets" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Snapchat Planets</Link>
            <Link to="/snapchat-score-guide" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Score Guide</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-12 gap-6 items-start">
        {/* Hero Section */}
        <section className="col-span-12 bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
            Snapchat Story Downloader
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Download and view Snapchat stories anonymously. Paste the Snapchat profile URL or username below to save HD videos and photos instantly.
          </p>
          
          <form onSubmit={handleSearch} className="w-full max-w-3xl flex flex-col sm:flex-row gap-3 p-2 bg-slate-100 rounded-2xl border-2 border-slate-200 focus-within:border-yellow-400 transition-all">
            <div className="flex items-center flex-1 pl-2">
              <Search className="w-5 h-5 text-slate-400 hidden sm:block" />
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Snapchat username or profile URL..." 
                className="flex-1 bg-transparent px-2 sm:px-4 py-3 outline-none text-slate-800 placeholder:text-slate-400 font-medium w-full"
              />
            </div>
            <button 
                type="submit"
                disabled={loading}
                className="bg-[#FFFC00] hover:bg-[#e6e300] text-slate-900 px-8 py-3 rounded-xl font-bold text-lg shadow-sm border border-slate-900/10 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Guidelines / small text */}
          <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1">
              Example: <span className="lowercase tracking-normal font-mono text-slate-500 ml-1 mt-[1px]">kimkardashian</span>
            </span>
          </div>
        </section>

        {/* Results Section */}
        <div className="col-span-12 mx-auto w-full max-w-4xl min-h-[300px]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4 animate-in fade-in">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Error Fetching Profile</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium animate-pulse">Connecting to Snapchat servers...</p>
            </div>
          )}

          {profile && (
            <div className="bg-white border text-center border-slate-200 shadow-sm rounded-3xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                {profile.bitmoji ? (
                  <img src={profile.bitmoji} alt={profile.displayName} className="w-32 h-32 rounded-full border-4 border-yellow-100 object-cover shadow-sm bg-yellow-50" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-50">
                    <span className="text-slate-400 font-semibold text-xl">{profile.username[0].toUpperCase()}</span>
                  </div>
                )}
                
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-slate-900 mb-1">{profile.displayName}</h2>
                  <p className="text-slate-500 font-mono text-lg mb-3">@{profile.username}</p>
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-100">
                    <CheckCircle2 className="w-4 h-4" /> {profile.stories.length} Stories Available
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {profile.stories.map((story, idx) => (
                  <div key={story.id} className="group relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Media Preview area */}
                    <div className="aspect-[9/16] bg-slate-900 relative">
                       {story.mediaType === 'video' ? (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center gap-1 z-10">
                            <Video className="w-3 h-3" /> Video
                          </div>
                       ) : (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center gap-1 z-10">
                            <ImageIcon className="w-3 h-3" /> Image
                          </div>
                       )}

                       {/* Preview Thumbnail */}
                       {story.previewUrl ? (
                         <img src={story.previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                             {story.mediaType === 'video' ? <Video className="w-12 h-12" opacity={0.5}/> : <ImageIcon className="w-12 h-12" opacity={0.5}/>}
                             <span className="text-sm font-medium">No Thumbnail</span>
                         </div>
                       )}
                       
                       {/* Play Overlay (if video) */}
                       {story.mediaType === 'video' && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                               <ChevronRight className="w-8 h-8 text-white ml-0.5" />
                            </div>
                         </div>
                       )}
                    </div>
                    
                    {/* Action Bar */}
                    <div className="p-4 bg-white">
                      {story.isM3U8 && (
                        <p className="text-xs text-orange-600 mb-3 bg-orange-50 p-2 rounded-lg leading-tight border border-orange-100">
                          <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />
                          Contains HLS Video Stream. Native audio may be detached depending on Snapchat's format.
                        </p>
                      )}
                      <button 
                        onClick={() => handleDownload(story)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        {story.isM3U8 ? "Download Video" : "Download Media"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* SEO & Features Content Section (Only visible when no search active) */}
        {!profile && !loading && (
          <div className="col-span-12 grid grid-cols-12 gap-6 mt-6">
             {/* Info Column */}
             <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-tighter text-slate-400 mb-4">How to Download</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm font-medium"><span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex shrink-0 items-center justify-center">01</span> Copy Snap profile URL</li>
                    <li className="flex items-center gap-3 text-sm font-medium"><span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex shrink-0 items-center justify-center">02</span> Paste into search field</li>
                    <li className="flex items-center gap-3 text-sm font-medium"><span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex shrink-0 items-center justify-center">03</span> Preview active stories</li>
                    <li className="flex items-center gap-3 text-sm font-medium"><span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex shrink-0 items-center justify-center">04</span> Click Download to save HD</li>
                  </ul>
                </div>
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex-1 flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-tighter text-slate-400 mb-4">Key Features</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-slate-50 flex flex-col items-center justify-center rounded-xl text-center border border-slate-100">
                      <Lock className="w-5 h-5 mb-1.5 text-slate-700" />
                      <div className="text-[10px] font-bold uppercase leading-tight text-slate-700">Safe & Secure</div>
                    </div>
                    <div className="p-3 bg-slate-50 flex flex-col items-center justify-center rounded-xl text-center border border-slate-100">
                      <Zap className="w-5 h-5 mb-1.5 text-slate-700" />
                      <div className="text-[10px] font-bold uppercase leading-tight text-slate-700">Fast Fetch</div>
                    </div>
                    <div className="p-3 bg-slate-50 flex flex-col items-center justify-center rounded-xl text-center border border-slate-100">
                      <FileVideo className="w-5 h-5 mb-1.5 text-slate-700" />
                      <div className="text-[10px] font-bold uppercase leading-tight text-slate-700">HD Quality</div>
                    </div>
                    <div className="p-3 bg-slate-50 flex flex-col items-center justify-center rounded-xl text-center border border-slate-100">
                      <Smartphone className="w-5 h-5 mb-1.5 text-slate-700" />
                      <div className="text-[10px] font-bold uppercase leading-tight text-slate-700">Mobile Ready</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-full mb-1">INTERNAL RESOURCES</span>
                    <Link to="/snapchat-score-guide" className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100">Snapchat Score Guide</Link>
                    <Link to="/snapchat-planets" className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100">Planets Meaning</Link>
                    <Link to="/snapchat-plus-guide" className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100">Snapchat Plus Guide</Link>
                    <Link to="/how-to-create-public-profile" className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100">Public Profile Setup</Link>
                  </div>
                </div>
             </div>

             {/* FAQ Content Section */}
             <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 bg-white border border-slate-200 p-8 rounded-2xl h-full">
                <h3 className="text-sm font-black uppercase tracking-tighter text-slate-400 mb-2">Common Questions (FAQ)</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    { q: "How do I download Snapchat stories?", a: "Simply paste the Snapchat profile URL or username into our tool and click Search. You will see all available public stories with a direct download button underneath." },
                    { q: "Can I download stories anonymously?", a: "Yes. Our server fetches the stories directly from the public Snapchat CDN. Your personal Snapchat account is never used or linked, meaning absolute anonymity." },
                    { q: "Is this tool free?", a: "Absolutely. You can download as many public stories as you want completely free of charge, with no hidden fees." },
                    { q: "Do I need a Snapchat account?", a: "No account login is required. You don't need to authenticate or provide any personal details to use SnapDownloader." },
                    { q: "Is there a download restrict or limit?", a: "Currently, there are no limits on how many public stories you can download per day." },
                    { q: "Can I save Spotlight videos?", a: "Yes, if the link points to a valid public spotlight video, our tool will parse and prepare it for download." },
                    { q: "Why is there no audio in my video?", a: "Snapchat occasionally uses split HLS streams (.m3u8). Directly downloaded video streams without transcoding might omit audio." },
                    { q: "Are my downloads secure?", a: "Yes. We do not store or track your downloads. The media is passed directly from Snapchat's CDN to your device." }
                  ].map((faq, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-slate-800">{faq.q}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center text-[11px] font-medium text-slate-500 gap-4 mt-auto">
        <div className="flex gap-6 order-2 md:order-1">
          <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-900">Terms of Service</Link>
          <Link to="/contact" className="hover:text-slate-900">Contact Support</Link>
        </div>
        <p className="order-1 md:order-2 text-center">© 2024 SnapSaver - Professional Snap Toolset. Not affiliated with Snap Inc.</p>
      </footer>
    </div>
  );
}

// Dummy components for SEO internal linking pages
const DummyPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-lg border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-600 mb-6 px-4">
        This is a placeholder SEO article/guide. In production, you would place long-form SEO content, markdown, or a CMS integration here.
      </p>
      <Link to="/" className="text-yellow-600 font-semibold hover:text-yellow-700">← Back to Downloader</Link>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DownloaderPage />} />
      <Route path="/snapchat-planets" element={<DummyPage title="Snapchat Planets Guide" />} />
      <Route path="/snapchat-score-guide" element={<DummyPage title="How to Increase Your Snapchat Score" />} />
      <Route path="/how-to-create-public-profile" element={<DummyPage title="Create a Public Snapchat Profile" />} />
      <Route path="/how-to-get-verified-snapchat" element={<DummyPage title="How to get Verified on Snapchat" />} />
      <Route path="/snapchat-plus-guide" element={<DummyPage title="Snapchat+ Premium Guide" />} />
      <Route path="/snapchat-score-not-updating" element={<DummyPage title="Fix: Snapchat Score Not Updating" />} />
      <Route path="*" element={<DummyPage title="Page Not Found" />} />
    </Routes>
  );
}
