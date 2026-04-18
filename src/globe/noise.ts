function hash(n: number) { return Math.abs((Math.sin(n) * 43758.5453123) % 1) }

function noise3(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x-ix, fy = y-iy, fz = z-iz
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy), uz = fz*fz*(3-2*fz)
  const h = (a:number,b:number,c:number) => hash(a+b*57+c*113)
  const l = (a:number,b:number,t:number) => a+(b-a)*t
  return l(l(l(h(ix,iy,iz),h(ix+1,iy,iz),ux),l(h(ix,iy+1,iz),h(ix+1,iy+1,iz),ux),uy),
           l(l(h(ix,iy,iz+1),h(ix+1,iy,iz+1),ux),l(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),ux),uy),uz)
}

export function fbm(x: number, y: number, z: number, oct =3) {
  let v = 0, a = 0.5, f = 1.5
  for (let i = 0; i < oct; i++) { v += (noise3(x*f, y*f, z*f)*2-1)*a; a *= 0.5; f *= 2 }
  return v
}
