import React, { useState } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';

export const CloudinaryApp: React.FC = () => {
  const cld = new Cloudinary({ cloud: { cloudName: 'c40zxlko' } });

  // Use this sample image or upload your own via the Media Library
  const img = cld
    .image('cld-sample-5')
    .format('auto') // Optimize delivery by resizing and applying auto-format and auto-quality
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(500).height(500)); // Transform the image: auto-crop to square aspect_ratio

  return <AdvancedImage cldImg={img} className="rounded-xl shadow-lg border border-hairline" />;
};

export const InteractiveCloudinarySDK: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>('cld-sample-5');
  const [size, setSize] = useState<number>(500);

  const cld = new Cloudinary({ cloud: { cloudName: 'c40zxlko' } });
  const img = cld
    .image(selectedAsset)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(size).height(size));

  return (
    <div className="rounded-xl border border-hairline bg-panel/40 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 pb-3">
        <div>
          <h4 className="text-sm font-bold text-body flex items-center gap-2">
            <span>Official Cloudinary React SDK (@cloudinary/react + @cloudinary/url-gen)</span>
          </h4>
          <p className="text-xs text-quiet">
            Rendering via <code className="text-accent">&lt;AdvancedImage cldImg=&#123;img&#125; /&gt;</code> with <code className="text-accent">autoGravity()</code> smart crop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-quiet">Sample:</span>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-xs text-body font-mono outline-none"
          >
            <option value="cld-sample-5">cld-sample-5 (Shoes/Sneakers)</option>
            <option value="cld-sample-1">cld-sample-1 (Landscape)</option>
            <option value="cld-sample-2">cld-sample-2 (Food / Feast)</option>
            <option value="cld-sample-3">cld-sample-3 (Basketball / Sport)</option>
            <option value="cld-sample-4">cld-sample-4 (Business Portrait)</option>
            <option value="sample">sample (Classic Flower)</option>
          </select>

          <span className="text-xs text-quiet ml-2">Size:</span>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-xs text-body font-mono outline-none"
          >
            <option value={300}>300x300</option>
            <option value={500}>500x500 (Default)</option>
            <option value={700}>700x700</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* Live AdvancedImage Render */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-canvas p-4 border border-hairline/70">
          <div className="max-w-[280px] max-h-[280px] overflow-hidden rounded-xl shadow-md border border-hairline">
            <AdvancedImage
              cldImg={img}
              alt="Cloudinary SDK rendered asset"
              className="h-full w-full object-cover transition-all duration-300"
            />
          </div>
          <span className="mt-2 text-[11px] font-mono text-quiet">
            Asset: <span className="text-accent font-semibold">{selectedAsset}</span> • {size}x{size}px • f_auto,q_auto,g_auto
          </span>
        </div>

        {/* Code Explanation & Execution Spec */}
        <div className="space-y-3 text-xs">
          <div className="rounded-lg bg-recess p-3 font-mono text-[11px] text-body space-y-1 border border-hairline/50">
            <p className="text-faint">// 1. Initialize client with user cloud</p>
            <p><span className="text-purple-400">const</span> cld = <span className="text-blue-400">new</span> Cloudinary(&#123; cloud: &#123; cloudName: <span className="text-emerald-400">'c40zxlko'</span> &#125; &#125;);</p>
            <p className="text-faint pt-1">// 2. Build URL Gen pipeline with smart crop</p>
            <p><span className="text-purple-400">const</span> img = cld.image(<span className="text-emerald-400">'{selectedAsset}'</span>)</p>
            <p className="pl-4">.format(<span className="text-emerald-400">'auto'</span>)</p>
            <p className="pl-4">.quality(<span className="text-emerald-400">'auto'</span>)</p>
            <p className="pl-4">.resize(auto().gravity(autoGravity()).width({size}).height({size}));</p>
            <p className="text-faint pt-1">// 3. Render via Cloudinary React SDK</p>
            <p>&lt;<span className="text-accent">AdvancedImage</span> cldImg=&#123;img&#125; /&gt;</p>
          </div>

          <div className="rounded-lg border border-hairline/60 bg-canvas p-3 space-y-1 text-quiet">
            <p className="font-semibold text-body">Optimization Features Active:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11.5px]">
              <li><strong className="text-body">Format Auto (f_auto):</strong> Negotiates AVIF/WebP depending on browser.</li>
              <li><strong className="text-body">Quality Auto (q_auto):</strong> Computes optimal compression ratio without quality loss.</li>
              <li><strong className="text-body">AI Auto-Gravity (g_auto):</strong> Centers the crop on the subject using Cloudinary AI detection.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryApp;

