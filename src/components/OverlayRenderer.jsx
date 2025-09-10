import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OverlayRenderer(){
  const [layout, setLayout] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('vst_last_layout')||'null') }catch{ return null }
  })
  const [form, setForm] = useState({})
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef(null)

  function handleLoadLayoutFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const r = new FileReader()
    r.onload = ()=>{
      try{
        const obj = JSON.parse(r.result)
        setLayout(obj)
        localStorage.setItem('vst_last_layout', JSON.stringify(obj))
        const initial = {}; Object.keys(obj.fields||{}).forEach(k=> initial[k]='')
        setForm(initial)
      }catch(err){ alert('invalid layout json') }
    }
    r.readAsText(f)
  }

  function handleChange(e,k){
    setForm(s=>({...s,[k]:e.target.value}))
  }

  async function exportPdf(){
    if(!containerRef.current) return
    const el = containerRef.current
    // subtle animation before screenshot
    el.classList.add('flash')
    await new Promise(r=> setTimeout(r,150))
    el.classList.remove('flash')
    const canvas = await html2canvas(el, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('output.pdf')
  }

  return (
    <div className="overlay">
      <aside className="left">
        <div className="controls">
          <label className="file">Load layout <input type="file" accept="application/json" onChange={handleLoadLayoutFile} /></label>
          {layout && <div className="row between"><div>Zoom</div><input type="range" min="50" max="200" value={zoom} onChange={e=>setZoom(parseInt(e.target.value))} /></div>}
          {layout && <button className="btn primary" onClick={exportPdf}>Export PDF</button>}
        </div>

        {layout && (
          <div className="fields-list">
            <h4>Fill fields</h4>
            {Object.keys(layout.fields).map(k=>(
              <label key={k} className="fill-row">{k}<input value={form[k]||''} onChange={(e)=>handleChange(e,k)} /></label>
            ))}
          </div>
        )}
      </aside>

      <section className="canvas" style={{transform:`scale(${zoom/100})`}}>
        <div className="canvas-inner" ref={containerRef}>
          {layout ? <div className="svg-frame" dangerouslySetInnerHTML={{__html: layout.svgText}} /> : <div className="muted">No layout loaded</div>}
          {layout && Object.keys(layout.fields).map(k=>{
            const f = layout.fields[k]; const txt = form[k] || ''
            const alignTransform = f.align === 'left' ? 'translate(0,-50%)' : f.align === 'right' ? 'translate(-100%,-50%)' : 'translate(-50%,-50%)'
            return <div key={k} className="render-txt" style={{left:`${f.xPct}%`,top:`${f.yPct}%`,fontSize:f.fontSize+'px',fontFamily:f.fontFamily,color:f.color,transform:alignTransform,textAlign:f.align}}>{txt}</div>
          })}
        </div>
      </section>
    </div>
  )
}
