window.esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.db = () => { if(!window.sb) throw new Error("Supabase belum dikonfigurasi. Isi assets/js/config.js terlebih dahulu."); return window.sb; };
window.msg = (el,s,bad=false) => {el.textContent=s;el.className="message "+(bad?"error":"success");};
window.profile = async () => {const s=db();const {data:{user}}=await s.auth.getUser();if(!user)return {user:null,p:null};const {data:p,error}=await s.from("profiles").select("id,full_name,role,created_at").eq("id",user.id).single();if(error)throw error;return {user,p};};
window.guard = async role => {const x=await profile();if(!x.user||!x.p||x.p.role!==role){location.replace("petugas.html");return null;}return x;};
document.addEventListener("DOMContentLoaded",()=>{const y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();});
