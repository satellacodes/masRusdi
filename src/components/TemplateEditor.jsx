import React, { useState, useRef, useEffect } from 'react'

const defaultFonts = ['Inter','Arial','Helvetica','Times New Roman','Georgia','Courier New','Verdana']

function downloadJSON(obj, filename = 'layout.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function TemplateEditor(){
  const [svgText, setSvgText] = useState(null)
  const [fields, setFields] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('vst_fields')||'{}') }catch{ return {} }
  })
  const [selected, setSelected] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [snap, setSnap] = useState(true)
  const containerRef = useRef(null)
  const [showHelp, setShowHelp] = useState(()=>!localStorage.getItem('vst_dismiss_help'))

  useEffect(()=>{
    fetch('/templates/template.svg').then(r=>r.ok? r.text(): null).then(t=>t && setSvgText(t)).catch(()=>{})
  },[])

  useEffect(()=>{
    localStorage.setItem('vst_fields', JSON.stringify(fields))
  },[fields])

  function handleSVGUpload(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setSvgText(reader.result)
    reader.readAsText(f)
  }

  function addField(){
    const key = prompt('Field key (unique, e.g. namaUser):')
    if(!key) return
    if(fields[key]) return alert('Key exists')
    setFields(s => ({ ...s, [key]: { label:key, xPct:10, yPct:10, fontSize:16, fontFamily:'Inter', color:'#000000', align:'center' } }))
    setTimeout(()=>setSelected(key),200)
  }

  function pointerDown(e,key){
    e.preventDefault()
    setSelected(key)
    const rect = containerRef.current.getBoundingClientRect()
    const onMove = (ev)=>{
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      let xPct = (x / rect.width) * 100
      let yPct = (y / rect.height) * 100
      if(snap){
        const grid = 2 // percent grid
        xPct = Math.round(xPct / grid) * grid
        yPct = Math.round(yPct / grid) * grid
      }
      xPct = Math.max(0,Math.min(100,xPct))
      yPct = Math.max(0,Math.min(100,yPct))
      setFields(s=>({...s,[key]:{...s[key],xPct,yPct}}))
    }
    const onUp = ()=>{
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setSelected(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function saveLayout(){
    const payload = { fields, svgText }
    downloadJSON(payload,'layout.json')
  }

  function loadLayout(jsonText){
    try{
      const obj = JSON.parse(jsonText)
      setFields(obj.fields||{})
      setSvgText(obj.svgText||null)
    }catch(e){ alert('Invalid JSON') }
  }

  function clearAll(){ if(confirm('Clear template and fields?')){ setSvgText(null); setFields({}); localStorage.removeItem('vst_fields') }}

  function deleteField(k){ if(confirm('Delete '+k+'?')){ const c = {...fields}; delete c[k]; setFields(c) }}

  function dismissHelp(){ setShowHelp(false); localStorage.setItem('vst_dismiss_help','1') }

  return (
    <div className="editor">
      {showHelp && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Welcome — Quick tips</h3>
            <ul>
              <li>Upload your SVG (exported from Visio).</li>
              <li>Click <strong>Add Field</strong>, then drag the placeholder to position it.</li>
              <li>Use Zoom, Snap-to-grid, and Grid overlay for precision.</li>
            </ul>
            <div className="modal-actions">
              <button onClick={dismissHelp} className="btn primary">Got it</button>
              <button onClick={()=>{ setShowHelp(false) }} className="btn">Close</button>
            </div>
          </div>
        </div>
      )}

      <aside className="left">
        <div className="controls">
          <label className="file">Upload SVG template <input type="file" accept="image/svg+xml" onChange={handleSVGUpload} /></label>
          <div className="row">
            <button className="btn primary" onClick={addField}>＋ Add Field</button>
            <button className="btn" onClick={saveLayout}>⬇ Save Layout</button>
            <label className="file small">Load Layout <input type="file" accept="application/json" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=> loadLayout(r.result); r.readAsText(f);}}/></label>
          </div>

          <div className="toggles">
            <label><input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.target.checked)} /> Show grid</label>
            <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} /> Snap to grid</label>
          </div>

          <div className="zoom">
            <label>Zoom: {zoom}%</label>
            <input type="range" min="25" max="200" value={zoom} onChange={e=>setZoom(parseInt(e.target.value))} />
          </div>

          <div className="fields-panel">
            <h4>Fields</h4>
            <ul>
              {Object.keys(fields).length === 0 && <li className="muted">No fields yet. Click Add Field.</li>}
              {Object.keys(fields).map(k=>{
                const f = fields[k]
                return (
                  <li key={k} className={selected===k? 'sel':''} onClick={()=>setSelected(k)}>
                    <div className="row between">
                      <strong>{k}</strong>
                      <div className="row">
                        <button className="tiny" onClick={(ev)=>{ev.stopPropagation(); deleteField(k)}}>Delete</button>
                      </div>
                    </div>
                    <div className="field-edit">
                      <label>Label<input value={f.label} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],label:e.target.value}}))} /></label>
                      <div className="pos-row">
                        <label>X% <input type="number" step="0.1" value={f.xPct} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],xPct:Math.max(0,Math.min(100,parseFloat(e.target.value||0)))}}))} /></label>
                        <label>Y% <input type="number" step="0.1" value={f.yPct} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],yPct:Math.max(0,Math.min(100,parseFloat(e.target.value||0)))}}))} /></label>
                      </div>
                      <div className="styling">
                        <label>Font <select value={f.fontFamily} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],fontFamily:e.target.value}}))}>{defaultFonts.map(ff=> <option key={ff} value={ff}>{ff}</option>)}</select></label>
                        <label>Size <input type="number" value={f.fontSize} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],fontSize:parseInt(e.target.value||14)}}))} /></label>
                        <label>Color <input type="color" value={f.color} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],color:e.target.value}}))} /></label>
                        <label>Align <select value={f.align} onChange={(e)=>setFields(s=>({...s,[k]:{...s[k],align:e.target.value}}))}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </aside>

      <section className="canvas-area">
        <div className={`canvas-wrap ${showGrid? 'grid-on':''}`} style={{transform:`scale(${zoom/100})`}} ref={containerRef}>
          <div className="svg-frame" dangerouslySetInnerHTML={{__html: svgText || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100"><rect width="100%" height="100%" fill="#fff" stroke="#111"/></svg>'}} />
          {Object.keys(fields).map(k=>{
            const f = fields[k]
            const alignTransform = f.align === 'left' ? 'translate(0,-50%)' : f.align === 'right' ? 'translate(-100%,-50%)' : 'translate(-50%,-50%)'
            return (
              <div key={k} className={`ph ${selected===k? 'selected':''}`} style={{ left:`${f.xPct}%`, top:`${f.yPct}%`, fontSize: f.fontSize+'px', fontFamily: f.fontFamily, color: f.color, transform: alignTransform }} onPointerDown={(e)=>pointerDown(e,k)} title={'Drag to reposition'}>
                <div className="ph-label">{f.label}</div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
