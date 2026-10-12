export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const progress = (t: number, a: number, b: number) => clamp((t - a) / Math.max(0.001, b - a));
export const smooth = (t: number, a: number, b: number) => {const p = progress(t, a, b); return p*p*(3-2*p);};
export const out = (t: number, a: number, b: number) => 1 - Math.pow(1-progress(t,a,b),3);
export const pop = (t: number, a: number, b: number) => {const q=progress(t,a,b);if(q===0||q===1)return q;const p=q-1; return 1+2.2*p*p*p+1.2*p*p;};
export const phase = (t: number, mark: number, lead = 0.4) => smooth(t, mark-lead, mark);
export const uid = (sceneId: string, name: string) => `${sceneId.replace(/[^a-zA-Z0-9_-]/g,'')}-${name}`;
// Deterministic arrivals drive both visual particles and numerical totals.
export function arrivals(t: number, start: number, end: number, count: number) {
  return Array.from({length:count},(_,i) => {
    const arrival = mix(start, end, (i+1)/count);
    return {arrival, p: progress(t,arrival-0.62,arrival), landed: t>=arrival};
  });
}
