export class Controls {
  constructor(canvas,onAction){
    this.canvas=canvas;this.onAction=onAction;this.lastInput='Ready';this.pointer=null;this.cleanup=[];
    const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);this.cleanup.push(()=>target.removeEventListener(event,fn,options));};
    listen(canvas,'pointerdown',e=>{
      e.preventDefault();if(!e.isPrimary){this.cancel();return;}if(e.pointerType==='mouse'&&e.button!==0)return;
      this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),done:false};canvas.setPointerCapture(e.pointerId);
    });
    listen(canvas,'pointermove',e=>{const p=this.pointer;if(!p||p.id!==e.pointerId||p.done)return;e.preventDefault();
      const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
      p.done=true;this.emit(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'slide':'jump','swipe');
    });
    listen(canvas,'pointerup',e=>{const p=this.pointer;if(!p||p.id!==e.pointerId)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(!p.done&&Math.max(Math.abs(dx),Math.abs(dy))>=24)this.emit(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'slide':'jump','swipe');
      else if(!p.done&&performance.now()-p.time<280&&Math.hypot(dx,dy)<24)this.emit('jump','tap');this.cancel();
    });
    listen(canvas,'pointercancel',()=>this.cancel());listen(canvas,'lostpointercapture',()=>{this.pointer=null;});
    listen(window,'contextmenu',e=>e.preventDefault());listen(canvas,'dblclick',e=>e.preventDefault());
    listen(window,'blur',()=>this.cancel());
    const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'slide',' ':'jump',a:'left',d:'right',w:'jump',s:'slide',p:'pause',Escape:'pause',m:'sound',F2:'debug'};
    listen(window,'keydown',e=>{if(e.target.closest?.('button,input,textarea,select'))return;const action=keys[e.key]||keys[e.key.toLowerCase()];if(!action)return;e.preventDefault();if(!e.repeat)this.emit(action,'key');});
  }
  emit(action,source){this.lastInput=`${source}: ${action}`;this.onAction(action);}
  cancel(){const p=this.pointer;this.pointer=null;if(p&&this.canvas.hasPointerCapture(p.id))this.canvas.releasePointerCapture(p.id);}
  dispose(){this.cancel();this.cleanup.forEach(f=>f());}
}
