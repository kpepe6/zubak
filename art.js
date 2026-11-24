(function (root) {
  "use strict";
  const canvas = document.getElementById("scene");
  canvas.width = 1920;
  canvas.height = 1080;
  let context = canvas.getContext("2d");
  const foreground = document.getElementById("foreground").getContext("2d");
  foreground.setTransform(2,0,0,2,0,0);
  context.setTransform(2,0,0,2,0,0);
  context.imageSmoothingEnabled = true;
  function rect(x, y, width, height, color) { context.fillStyle = color; context.fillRect(x, y, width, height); }
  function oval(x,y,radiusX,radiusY,color) {
    context.fillStyle=color;context.beginPath();context.ellipse(x,y,radiusX,radiusY,0,0,Math.PI*2);context.fill();
  }
  const textures=new Map();
  function texture(x,y,width,height,count,color,seed=0) {
    const key=[width,height,count,color,seed].join(":");
    if(!textures.has(key)) {
      const layer=document.createElement("canvas");layer.width=Math.ceil(width*2);layer.height=Math.ceil(height*2);
      const brush=layer.getContext("2d");brush.scale(2,2);brush.fillStyle=color;
      for(let grain=0;grain<count;grain++) {
        const left=((grain*73+seed*17)%997)/997*width;
        const top=((grain*139+seed*31)%991)/991*height;
        brush.fillRect(left,top,.35+grain%3*.25,.3);
      }
      textures.set(key,layer);
    }
    context.drawImage(textures.get(key),x,y,width,height);
  }
  function poly(points, color) { context.fillStyle = color; context.beginPath(); points.forEach(([left, top], index) => index ? context.lineTo(left, top) : context.moveTo(left, top)); context.closePath(); context.fill(); }
  function line(points, color, width) { context.strokeStyle = color; context.lineWidth = width; context.lineJoin = "round"; context.beginPath(); points.forEach(([left, top], index) => index ? context.lineTo(left, top) : context.moveTo(left, top)); context.stroke(); }
  function tree(x, y, scale = 1, shade = 0) {
    context.save(); context.translate(x, y); context.scale(scale, scale);
    poly([[-13, 7], [8, 2], [33, 14], [9, 19]], "#193f3026");
    rect(-3, -23, 6, 34, "#615d40"); rect(-2, -17, 2, 26, "#a49360");
    for (let tier = 0; tier < 4; tier++) {
      const top = -53 + tier * 11; const spread = 12 + tier * 4;
      poly([[0, top], [-spread, top + 23], [-spread + 6, top + 23], [-spread - 2, top + 28], [spread, top + 27], [spread - 4, top + 20]], shade ? "#245442" : "#36684a");
      poly([[0, top], [-spread + 1, top + 22], [-4, top + 19], [1, top + 8]], shade ? "#3e7954" : "#64915a");
      rect(-spread + 4, top + 20, 6, 2, "#8ba66a");
      for(let needle=0;needle<12;needle++) {
        const branchX=(needle/11-.5)*spread*1.6;
        const branchY=top+17+Math.abs(branchX)*.35;
        line([[branchX,branchY],[branchX+3,branchY+2]],needle%3 ? "#a5b57a55" : "#123e3855",.55);
      }
    }
    context.restore();
  }
  function leafyTree(x, y, scale = 1) {
    context.save(); context.translate(x, y); context.scale(scale, scale);
    poly([[-23, 8], [14, 3], [41, 15], [2, 23]], "#233d302a");
    rect(-4, -39, 8, 52, "#786947"); rect(-2, -34, 3, 45, "#b0a071");
    line([[0, -21], [-15, -37]], "#786947", 5);
    [[0,-53,24],[-20,-38,22],[19,-39,23],[-4,-27,25]].forEach(([left,top,size], index) => {
      oval(left,top,size,size*.85,["#60834b","#7c9a53","#456f47","#587d47"][index]);
      for(let leaf=0;leaf<22;leaf++) {
        const angle=leaf*2.399;
        const distance=Math.sqrt((leaf+.5)/22)*size*.85;
        oval(left+Math.cos(angle)*distance,top+Math.sin(angle)*distance*.8,2.7,1.7,leaf%3 ? "#a7bc7959" : "#294e3a55");
      }
    });
    context.restore();
  }
  function fence(x, y, length, scale = 1) {
    for (let post = 0; post <= length; post += 18 * scale) {
      rect(x + post, y - 26 * scale, 5 * scale, 33 * scale, "#b5b28a");
      rect(x + post, y - 26 * scale, 2 * scale, 33 * scale, "#e1d6ac");
    }
    rect(x, y - 19 * scale, length, 4 * scale, "#d2c49a"); rect(x, y - 5 * scale, length, 3 * scale, "#a59e76");
  }
  function flowers(x, y, count, scale = 1) {
    for (let index = 0; index < count; index++) {
      const left = x + index * 13 * scale; const top = y + Math.sin(index * 2.4) * 5 * scale;
      rect(left, top, 2 * scale, 8 * scale, "#58754b");
      rect(left - 2 * scale, top - 2 * scale, 5 * scale, 4 * scale, ["#e2bc66","#e8d6a5","#bd7390"][index % 3]);
    }
  }
  function lettering(text, x, y, size = 10, color = "#eee1b9") {
    context.font = `bold ${size}px Georgia`; context.textAlign = "center"; context.fillStyle = color; context.fillText(text, x, y);
  }
  function slovakFlag(x, y, scale = 1) {
    context.save(); context.translate(x,y); context.scale(scale,scale);
    rect(0,0,1,31,"#b9bfaa");
    rect(1,1,18,4,"#f4f2e9"); rect(1,5,18,4,"#315da1"); rect(1,9,18,4,"#cf3c46");
    poly([[4,3],[10,3],[10,8],[9,10],[7,11],[5,10],[4,8]],"#f4f2e9");
    poly([[5,4],[9,4],[9,8],[7,10],[5,8]],"#cf3c46");
    rect(6,5,3,1,"#ffffff"); rect(5,7,4,1,"#ffffff"); rect(7,4,1,5,"#ffffff");
    poly([[5,9],[6,8],[7,9],[8,8],[9,9],[7,10]],"#315da1");
    context.restore();
  }
  function portrait(x, y, hero) {
    context.save(); context.translate(x,y);
    rect(-3,-3,68,92,"#524737"); rect(0,0,62,86,"#d5b56f"); rect(3,3,56,66,hero ? "#78947d" : "#8198a1");
    poly([[8,69],[12,48],[24,43],[39,43],[51,51],[55,69]],hero ? "#e2d7b4" : "#354650");
    rect(26,39,12,11,"#d5a37e");
    if (hero) { rect(16,23,9,30,"#493329");rect(39,23,8,30,"#493329"); }
    poly([[21,18],[38,16],[45,24],[42,39],[35,45],[26,42],[19,32]],"#e3b18a");
    poly([[19,22],[21,15],[31,12],[41,17],[44,24],[35,20],[26,20]],hero ? "#493329" : "#aaa392");
    if (hero) {
      poly([[12,20],[21,17],[25,5],[40,7],[44,17],[52,21]],"#443a32");
      rect(22,15,22,3,"#b85043");
      rect(18,58,27,5,"#765344");rect(29,57,6,7,"#c8ab61");
      line([[46,65],[51,29]],"#a6a79b",3);
    } else {
      poly([[24,46],[31,52],[38,46],[35,64],[31,68],[27,62]],"#ae3844");
      line([[13,51],[25,57],[23,46]],"#61717c",2);line([[49,51],[38,57],[39,46]],"#61717c",2);
    }
    rect(24,27,5,2,"#493f35");rect(35,27,5,2,"#493f35");rect(31,29,2,7,"#b58060");rect(28,38,9,1,"#805845");
    lettering(hero ? "JÁNOŠÍK" : "FICO",31,80,10,"#3c4138");
    context.restore();
  }
  function house(x, y, kind = "house", scale = 1) {
    context.save(); context.translate(x, y); context.scale(scale, scale);
    const wide = ["school", "nursery", "flats", "pub", "shop", "office"].includes(kind);
    const width = wide ? 55 : 39;
    poly([[-width / 2, 8], [width / 2 + 10, -1], [width / 2 + 35, 18], [-width / 2 + 19, 26]], "#1c3e3033");
    if (kind === "cottage") {
      poly([[-31, 7], [18, 7], [32, -2], [-17, -2]], "#525c4760");
      rect(-27, -4, 51, 13, "#969483");
      rect(-25, -31, 48, 30, "#765b42");
      for (let beam = 0; beam < 6; beam++) {
        rect(-27, -30 + beam * 5, 52, 2, beam % 2 ? "#b59a6b" : "#947b53");
        rect(-28, -29 + beam * 5, 5, 3, "#d2ba88");
        rect(21, -29 + beam * 5, 6, 3, "#d2ba88");
      }
      poly([[-33, -30], [-5, -59], [31, -30]], "#424f4e");
      poly([[-5, -59], [7, -56], [34, -30], [28, -30]], "#677472");
      for (let shingle = 0; shingle < 5; shingle++) line([[-24 + shingle * 5, -35 - shingle * 4], [23 - shingle * 4, -35 - shingle * 4]], "#84918a", 1);
      rect(12, -54, 6, 13, "#bdad91"); rect(11, -56, 8, 3, "#e1d3b3");
      rect(-18, -23, 12, 14, "#e5d7a9"); rect(-16, -21, 8, 10, "#8ab5b4");
      rect(-13, -21, 2, 10, "#f2dfb1"); rect(-16, -17, 8, 2, "#f2dfb1");
      rect(3, -23, 11, 23, "#433f32"); rect(5, -21, 7, 21, "#9b7950"); rect(9, -11, 2, 2, "#e6c77e");
      rect(-20, -8, 17, 4, "#aa6851"); rect(-17, -11, 4, 4, "#b8c17a"); rect(-11, -12, 4, 5, "#c99185");
      rect(0, 0, 18, 3, "#c3b898"); rect(-3, 3, 24, 3, "#a9a58b");
    } else if (kind === "tower") {
      const levels=[0,-23,-46,-69,-92];
      line([[-16,4],[-14,-98]],"#514334",5);line([[16,4],[14,-98]],"#493d31",5);
      line([[-13,-3],[13,-25]],"#c0a276",2);line([[13,-3],[-13,-25]],"#866d4e",2);
      levels.forEach((top,index)=>{
        const width=24+(index===0?10:0);
        rect(-width/2,top-5,width,5,index%2?"#594b3b":"#766047");
        rect(-width/2,top-9,width,2,"#a4865c");
        rect(-width/2,top-15,2,8,"#5e4d3b");rect(width/2-2,top-15,2,8,"#5e4d3b");
        for(let rail=0;rail<6;rail++) rect(-width/2+3+rail*(width-6)/5,top-15,.9,8,"#b4996c");
        for(let plank=0;plank<4;plank++) line([[-width/2+2,top-13+plank*2],[width/2-2,top-13+plank*2]],plank%2?"#9c8058":"#715a41",.8);
        if(index<4){line([[-12,top-17],[12,top-34]],"#bf9c6a",2);line([[12,top-17],[-12,top-34]],"#765e43",2);}
      });
      poly([[-19,-108],[-12,-122],[0,-128],[12,-122],[19,-108]],"#514436");
      poly([[-20,-108],[0,-123],[20,-108],[15,-105],[-15,-105]],"#9c8057");
      for(let grain=0;grain<6;grain++) line([[-15+grain*5,-108],[-12+grain*4,-121]],"#d1b18177",.7);
      rect(-1,-130,2,8,"#5c4c39");
    } else if (kind === "well") {
      poly([[-18,-3],[10,-7],[21,3],[-8,9]],"#666e61");
      poly([[-15,-2],[9,-5],[17,3],[-7,7]],"#8f9787");
      line([[-13,0],[11,3]],"#b8bdab",1); rect(-2,0,5,2,"#38473d");
    } else if (kind === "spring") {
      poly([[-30,4],[-23,-17],[-6,-30],[20,-21],[29,7]],"#777d83");
      poly([[-23,-17],[-6,-30],[5,-20],[-8,-6]],"#adb0b2");
      rect(-5,-10,20,6,"#a3ada6");rect(12,-9,5,5,"#3f514c");
      line([[15,-5],[15,8],[25,12]],"#a7d6cf",3);
      poly([[8,12],[24,8],[34,14],[19,20]],"#709e9d");
    } else if (kind === "church") {
      poly([[17,-36],[52,-48],[52,5],[17,14]],"#c6ba88");
      poly([[0,-59],[36,-69],[57,-48],[19,-36]],"#bf7057");
      rect(-27,-36,46,50,"#e7d59b");
      poly([[-30,-36],[-5,-58],[22,-36]],"#f0dfab");
      rect(-28,-37,49,3,"#f6edd1");
      [-24,13].forEach(left=>rect(left,-34,4,47,"#fff0ce"));
      rect(-27,8,46,6,"#786858");
      rect(-13,-85,24,41,"#e5dfc4");
      poly([[11,-85],[18,-89],[18,-49],[11,-44]],"#bcbda9");
      poly([[-17,-85],[-1,-111],[17,-85]],"#b76c55");
      line([[-17,-85],[-1,-111],[17,-85]],"#855b4b",1);
      rect(-1,-117,1,7,"#655e4c");line([[-3,-115],[2,-115]],"#655e4c",.8);
      rect(-6,-76,10,14,"#768c86");
      for(let slat=0;slat<5;slat++) line([[-5,-74+slat*2],[3,-75+slat*2]],"#ced1bd",.7);
      rect(-6,-53,8,10,"#81928a");
      oval(-5,-24,5,6,"#a38b5c");rect(-10,-24,10,5,"#a38b5c");
      rect(-10,-8,12,22,"#655847");rect(-12,-10,16,2,"#efe1ba");
      for(let step=0;step<6;step++) rect(-13-step*1.6,14+step*2.7,18+step*3.2,2.7,step%2?"#a3a18a":"#c4bfa5");
      line([[-17,14],[-27,30]],"#656f63",1);line([[8,14],[18,30]],"#656f63",1);
    } else if (kind === "cross") {
      for (let step = 0; step < 3; step++) { rect(step * 14 - 15, -step * 14 - 13, 4, 22, "#d7c393"); rect(step * 14 - 20, -step * 14 - 9, 14, 4, "#d7c393"); }
    } else if (kind === "forest" || kind === "ridge") { tree(-11, -4, 1.1); tree(10, -9, 1.3, 1); }
    else if (kind === "festival") {
      poly([[-40, -5], [-26, -37], [-10, -5]], "#d87660"); poly([[-10, -5], [-26, -37], [5, -5]], "#f2cd84"); rect(-40, -5, 45, 17, "#d4bd86");
      poly([[6, -6], [25, -40], [46, -6]], "#f0d091"); rect(7, -6, 38, 17, "#c28356"); rect(-7, 7, 18, 8, "#374b43");
    } else if (kind === "bus") {
      rect(-24, -22, 43, 26, "#d9b752"); rect(-20, -19, 34, 12, "#8fbac1"); rect(-19, 2, 8, 8, "#33413c"); rect(8, 2, 8, 8, "#33413c"); rect(27, -36, 3, 44, "#abbcb0"); rect(22, -37, 13, 13, "#e7e8d0");
    } else {
      const height = kind === "flats" ? 62 : kind === "school" ? 55 : kind === "nursery" ? 39 : kind === "pub" ? 42 : 34;
      if(kind === "shop") {
        poly([[width/2,-height],[width/2+12,-height+4],[width/2+12,3],[width/2,8]],"#c1b89b");
        rect(-width/2-2,-height-5,width+16,6,"#817b68");
        rect(-width/2-2,-height-9,width+16,5,"#e9dfc2");
      } else {
        poly([[width / 2, -height], [width / 2 + 15, -height - 10], [width / 2 + 15, -2], [width / 2, 8]], "#9b9d81");
        if (kind === "school") poly([[8,-height-16],[width/2+20,-height-9],[width/2+5,-height]],"#493831");
        else poly([[0, -height - 20], [15, -height - 29], [width / 2 + 20, -height - 9], [width / 2 + 5, -height]], "#744c43");
        if (kind !== "school") for(let course=1;course<7;course++) {
          const fraction=course/7;
          line([ [fraction*15,-height-20-fraction*9], [width/2+5+fraction*15,-height-fraction*9] ],"#ca96775c",.45);
        }
        if (kind !== "school") for(let seam=1;seam<7;seam++) {
          const fraction=seam/7;
          line([[fraction*(width/2+5),-height-20+fraction*20],[15+fraction*(width/2+5),-height-29+fraction*20]],"#4a332d55",.4);
        }
      }
      rect(width / 2 + 5, -height + 5, 6, 10, "#577776");
      rect(-width / 2, -height, width, height + 8, kind === "nursery" ? "#d8cfb5" : kind === "school" ? "#eee8d6" : kind === "flats" ? "#ddd2c7" : kind === "shop" ? "#e5d7a4" : "#dfcfab");
      if (kind === "flats") { rect(-width/2,-height+13,width,9,"#c78168");rect(-width/2,-height+34,width,8,"#cf8a70");rect(-width/2,1,width,6,"#eee6d6"); }
      if (kind === "school") { rect(-width/2,3,width,6,"#563d34");rect(width/2-13,-height-17,13,height+20,"#c6bda4"); }
      if (kind === "nursery") rect(-width/2,1,width,6,"#6f4039");
      if (kind === "shop") { rect(-width/2,-height+7,width,6,"#fff0c8");rect(-width/2,-height+16,width*.48,height-19,"#425451");rect(-width/2+width*.52,-height+16,width*.48,height-23,"#394d4d");line([[0,-height+18],[0,-3]],"#d4c398",1);rect(-width/2-2,7,width+4,3,"#826d50"); }
      if (kind === "pub") { rect(-width/2,2,width,6,"#645444");rect(width/2-10,-height-9,10,height+12,"#593e37");poly([[width/2-12,-height-9],[width/2-7,-height-16],[width/2+2,-height-9]],"#8e5147"); }
      const facadeLight=context.createLinearGradient(-width/2,0,width/2,0);
      facadeLight.addColorStop(0,"#fff1c32b");facadeLight.addColorStop(.7,"#fff1c300");facadeLight.addColorStop(1,"#3e423a20");
      rect(-width/2,-height,width,height+8,facadeLight);
      rect(-width/2,-height,width,2,"#4e4b3740");
      rect(width / 2 - 7, -height, 7, height + 8, "#baaf8e");
      if (kind === "shop") { rect(-width/2-2,-height-3,width+4,5,"#e9dfc2");rect(-width/2-2,-height-3,width+4,2,"#817b68"); }
      else if (kind === "school") poly([[-width/2-5,-height],[-8,-height-16],[8,-height-16],[width/2+5,-height]],"#655047");
      else { poly([[-width / 2 - 5, -height], [0, -height - 20], [width / 2 + 5, -height]], kind === "pub" ? "#715d55" : kind === "school" || kind === "nursery" ? "#533e35" : kind === "flats" ? "#51463d" : "#a76350");if(kind==="school"||kind==="nursery") poly([[0,-height-20],[width/2+5,-height],[width/2+14,-height+3],[width/2+13,-height-5]],"#493831"); }
      if(!["flats","shop","school","nursery"].includes(kind)) for (let column = 0; column < (wide ? 3 : 2); column++) { rect(-width / 2 + 6 + column * 15, -height + 9, 8, 9, "#5c8d94"); rect(-width / 2 + 7 + column * 15, -height + 10, 2, 8, "#b4d2bc"); }
      rect(-4, -10, 9, 18, "#776951");
      texture(-width/2+1,-height+2,width-2,height-3,130,"#73675030",width);
      if (kind !== "school" && kind !== "shop") for(let course=1;course<6;course++) {
        const roofY=-height-course*3;
        const half=(width/2+5)*(1-course*3/20);
        line([[-half,roofY],[half,roofY]],"#602e284d",.55);
        for(let tile=-half+2;tile<half;tile+=4) line([[tile,roofY],[tile+1,roofY+2.5]],"#edac8366",.45);
      }
      for(let row=0;row<(kind === "flats" ? 3 : 1);row++) for(let column=0;column<(wide ? 3 : 2);column++) {
        const windowX=-width/2+6+column*15;
        const windowY=-height+9+row*14;
        line([[windowX+1,windowY+7],[windowX+6,windowY+1]],"#e2f2e180",.65);
        rect(windowX,windowY+4,8,.5,"#e8dfc8");
        rect(windowX+3.5,windowY,.5,9,"#f0dfbb");
      }
      line([[-3,-9],[-3,6]],"#c5ab7c",.6);rect(2,-2,1,1,"#eed9a2");
      rect(-width / 2, 4, width, 4, "#a59d82");
      if (kind !== "shop") rect(-width / 2 - 3, -height, width + 6, 3, "#774f43");
      if (kind !== "school" && kind !== "shop") {
        for (let tile = 0; tile < 4; tile++) line([[-width / 2 + tile * 6, -height - tile * 4], [width / 2 - tile * 6, -height - tile * 4]], "#c17e60", 1);
        rect(-width / 2 + 7, -height - 16, 5, 14, "#cab998"); rect(-width / 2 + 6, -height - 18, 7, 3, "#e0d1ad");
      }
      for (let column = 0; column < (wide ? 3 : 2); column++) {
        const left = -width / 2 + 6 + column * 15;
        rect(left - 1, -height + 8, 10, 1, "#f6e8bc"); rect(left - 1, -height + 18, 10, 2, "#e8d7af");
        rect(left + 3, -height + 9, 1, 9, "#d8e3cc");
      }
      rect(-7, 7, 16, 3, "#d5c9a6"); rect(-10, 10, 22, 3, "#a9a88b");
      if (kind === "flats") {
        for(let row=0;row<3;row++) for(let column=0;column<3;column++) { const left=(column-1)*width/3-5,top=-height+7+row*16;rect(left,top,10,9,"#405958");rect(left+1,top+1,8,7,"#94b3b0");rect(left+4,top+1,1,7,"#eee3c5"); }
        for(let band=0;band<3;band++) rect(-width/2+5,-height+5+band*16,width-10,1,"#f1e7d3");
      }
      if (kind === "school") {
        for(let row=0;row<2;row++) for(let column=0;column<3;column++) { const left=(column-1)*width/3-4,top=-height+9+row*21;rect(left,top,8,12,"#566d6c");rect(left+1,top+1,6,10,"#a7bbb0");rect(left+3.5,top,1,12,"#e7dfc7"); }
        rect(-width/2+7,-7,8,9,"#57483a");
      }
      if (kind === "nursery") { for(let column=0;column<3;column++) { const left=-width/2+7+column*12;rect(left,-height+12,8,13,"#546a68");rect(left+1,-height+13,6,11,"#9fbab2"); }rect(-5,-12,10,20,"#755b48"); }
      if (kind === "shop") { rect(-width/2+4, -10, width-8, 8, "#a64441"); lettering("COOP", 0, -3, 7); }
      if (kind === "office") { rect(-10, -29, 21, 7, "#6e8d87"); lettering("ÚRAD", 0, -23, 5); slovakFlag(28,-49); }
      if (kind === "nursery") { rect(-18, -6, 7, 6, "#a2779e"); rect(12,-5,7,5,"#698b9c"); }
      if (kind === "pub") { rect(-21, -23, 43, 12, "#475e49"); rect(-19, -22, 39, 10, "#e1c788"); }
    }
    context.restore();
  }
  function person(x, y, color, scale = 1, protagonist = false, time = 0, hairColor = "#594b3b") {
    context.save(); context.translate(x, y); context.scale(scale, scale);
    oval(1,2,14,3.8,"#273c344d");
    const stride = protagonist ? Math.round(Math.sin(time * 7) * 2) : 0;
    rect(-6, -17, 5, 16 + stride, "#304a56"); rect(2, -17, 5, 16 - stride, "#304a56"); rect(-7, -1 + stride, 7, 3, "#283d38"); rect(2, -1 - stride, 8, 3, "#283d38");
    rect(-9, -36, 18, 22, color); rect(-13, -33, 5, 17, "#ebbc8b"); rect(9, -33, 5, 17, "#ebbc8b");
    if (protagonist) {
      rect(-9, -36, 18, 22, "#bd3540");
      rect(-13, -33, 5, 8, "#bd3540"); rect(9, -33, 5, 8, "#bd3540");
      for (let stripe = -33; stripe < -14; stripe += 6) {
        rect(-9, stripe, 18, 3, "#fff4e9");
        if (stripe < -25) { rect(-13, stripe, 5, 3, "#fff4e9"); rect(9, stripe, 5, 3, "#fff4e9"); }
      }
    }
    rect(-8,-35,3,18,"#ffffff28");rect(5,-32,4,16,"#152e3338");rect(-5,-17,11,2,"#f1cb9855");
    texture(-7,-33,13,17,28,"#ffffff20",4);
    line([[-5,-15],[-4,-3]],"#89a5ad",.6);line([[5,-15],[5,-3]],"#152f43",.7);
    poly([[-8,-49],[-6,-54],[0,-56],[6,-54],[9,-49],[8,-40],[4,-35],[-2,-35],[-7,-40]],"#eab38b");
    oval(-3,-47,4,6,"#f6cba43d");
    poly([[-9,-49],[-8,-55],[-3,-58],[5,-57],[10,-53],[10,-49],[3,-52],[-3,-51]],hairColor);
    if (protagonist) {
      poly([[-10,-51],[-8,-57],[-2,-59],[4,-59],[10,-55],[11,-49],[7,-51],[2,-55],[-3,-54],[-6,-50]],"#33251f");
      line([[0,-58],[1,-54]],"#70503a",1);
      for (const side of [-1, 1]) {
        const sway = Math.sin(time * 7) * side;
        for (let segment = 0; segment < 6; segment++) {
          const braidX = side * (10 + segment * .35) + sway * segment / 5;
          const braidY = -49 + segment * 3;
          poly([[braidX-3,braidY],[braidX,braidY-2],[braidX+3,braidY],[braidX+2,braidY+3],[braidX-1,braidY+4]],"#39291f");
          line([[braidX-1,braidY],[braidX+1,braidY+2]],segment % 2 ? "#78533b" : "#5b3e2d",1);
        }
        rect(side * 12 - 2 + sway,-30,4,2,"#244b46");
        poly([[side*12-2+sway,-28],[side*12+2+sway,-28],[side*13+1+sway,-23],[side*13-2+sway,-24]],"#39291f");
      }
    }
    rect(-4, -46, 2, 3, "#33413c"); rect(5, -46, 2, 3, "#33413c");
    if (protagonist) {
      line([[-8,-47],[-6,-49],[-2,-49],[0,-47],[0,-44],[-2,-42],[-6,-42],[-8,-44],[-8,-47]],"#302729",1.5);
      line([[2,-47],[4,-49],[8,-49],[10,-47],[10,-44],[8,-42],[4,-42],[2,-44],[2,-47]],"#302729",1.5);
      line([[0,-46],[2,-46]],"#302729",1.5);
      rect(-6,-47,2,1,"#f6e6cb"); rect(4,-47,2,1,"#f6e6cb");
    }
    rect(0,-40,4,1,"#ac705b");rect(-6,-43,3,2,"#df987d");rect(6,-43,3,2,"#df987d");
    line([[1,-45],[2,-42],[.5,-41]],"#bc876a",.55);
    line([[-2,-38],[1,-37],[4,-38]],"#8d574c",.55);
    if (protagonist) {
      rect(-13,-25,5,9,"#bd3540");
      rect(-13,-24,5,3,"#fff4e9");
      rect(-13,-21,5,5,"#eab38b");
      line([[11,-23],[13,-21],[11,-24]],"#eab38b",2.5);
      oval(12,-22,3.5,3.5,"#f5f0df"); oval(12,-22,1.8,1.9,"#41574e");
      rect(14,-27,8,9,"#f5f0df"); oval(18,-18,4,1.5,"#d5d9cd");
      oval(18,-27,4,1.8,"#dfd8bf"); oval(18,-27,3,1,"#563526");
      oval(11,-25,1.6,2,"#eab38b");
      line([[10.5,-25.5],[12,-25.5]],"#bd8769",.5);
      line([[16,-32],[15,-35],[17,-37]],"#fff8e6bb",1);
      line([[20,-32],[21,-34],[20,-36]],"#fff8e6bb",1);
    }
    context.restore();
  }
  function mamaHair(left, top, scale) {
    context.save(); context.translate(left,top); context.scale(scale,scale);
    poly([[-10,-49],[-9,-56],[-4,-60],[4,-60],[10,-56],[11,-48],[7,-49],[3,-54],[-3,-54],[-7,-49]],"#181c1b");
    poly([[-10,-51],[-7,-49],[-7,-38],[-8,-24],[-14,-21],[-12,-36]],"#181c1b");
    poly([[8,-51],[11,-50],[13,-36],[15,-22],[9,-24],[7,-38]],"#181c1b");
    line([[-9,-48],[-10,-35],[-11,-26]],"#3b403d",1);
    line([[10,-47],[10,-35],[12,-27]],"#3b403d",1);
    context.restore();
  }
  function drawCharacter(target, x, y, color, scale, protagonist = false, time = 0, character = "") {
    const previous = context;
    context = target;
    try {
      person(x, y, color, scale, protagonist, time, character === "tato" ? "#b18457" : undefined);
      if (character === "mama") mamaHair(x, y, scale);
    } finally { context = previous; }
  }
  function landscape(time, map, leftTreesOnly = false, tallerTrees = false) {
    rect(0, 0, 960, 540, "#a8cfc6");
    const sky=context.createLinearGradient(0,0,0,240);
    sky.addColorStop(0,"#80b7c5");sky.addColorStop(.7,"#d4e6d6");sky.addColorStop(1,"#edf0ce");
    rect(0,0,960,250,sky);
    oval(809,54,18,18,"#f6e5ad");
    for (let cloud = 0; cloud < 6; cloud++) {
      const left = (cloud * 190 + time * 2) % 1150 - 100;
      const top=39+cloud%3*20;
      oval(left+35,top+6,44,7,"#eff3e084");
      oval(left+20,top,21,9,"#f6f5e68c");oval(left+43,top-5,24,12,"#f6f5e68c");oval(left+66,top+1,19,8,"#f6f5e68c");
    }
    poly([[0, 160], [100, 79], [194, 113], [300, 58], [420, 133], [560, 72], [680, 108], [785, 52], [960, 153], [960, 540], [0, 540]], "#7b9b77");
    poly([[0, 208], [140, 123], [245, 174], [354, 107], [489, 200], [623, 123], [743, 168], [855, 96], [960, 178], [960, 540], [0, 540]], "#60845d");
    poly([[0, 248], [170, 192], [310, 220], [480, 169], [640, 218], [800, 170], [960, 248], [960, 540], [0, 540]], "#8ba16a");
    for (let ridge = 0; ridge < 7; ridge++) {
      const start = ridge * 157 - 70;
      poly([[start,220],[start+130,173+ridge%3*12],[start+85,260],[start-45,290]], ridge%2 ? "#76935f" : "#819b66");
      line([[start+15,240],[start+75,222],[start+110,205]],"#a1b47b55",2);
      texture(start,220,130,60,65,"#d9e5a926",ridge);
    }
    if (map) {
      poly([[0, 411], [180, 307], [300, 263], [487, 290], [700, 253], [960, 403], [960, 540], [0, 540]], "#a8b579");
      poly([[50,438],[203,338],[280,347],[157,462]],"#b5bc7b");
      poly([[640,355],[742,325],[877,389],[754,419]],"#bfbe7e");
      for (let furrow = 0; furrow < 9; furrow++) line([[658+furrow*13,358+furrow*5],[735+furrow*13,338+furrow*5]],"#929a633d",2);
      for (let index = 0; index < 220; index++) { const left = (index * 167 + 37) % 960; const top = 140 + (index * 73) % 380; if ((left < 150 || top < 220 || left > 875) && !(top < 170 && left > 420 && left < 740)) tree(left, top, .45 + index % 4 * .08, index % 2); }
      const stream = [[0,350],[100,346],[165,377],[285,394],[375,380],[449,416],[520,398],[602,413],[679,360],[746,347],[825,377],[903,391],[960,417]];
      line(stream, "#528d92", 9); line(stream, "#92c4b8", 3);
      line([[510,111],[525,170],[543,240],[538,310],[520,398]],"#78b4ae",4);
      const roads = [[[0,304],[112,310],[172,287],[271,287],[364,318],[465,320],[549,319],[632,318],[712,288],[785,309],[853,334],[929,381],[960,382]], [[548,319],[551,243],[555,209],[524,197],[493,160],[470,143]], [[114,310],[121,385],[101,443],[70,510]], [[364,318],[372,374],[423,441]], [[853,334],[896,398],[882,520]], [[712,288],[738,227],[759,145]]];
      roads.forEach(road => { line(road, "#6c8053", 13); line(road, "#c7c394", 8); });
      line([[759,145],[814,155],[863,135],[873,120]],"#c7c394",4);
      line([[48,306],[48,330]],"#c7c394",4);
      [[121,368],[520,397],[901,391]].forEach(([left,top])=>{line([[left-11,top+8],[left+11,top-8]],"#7b7055",16);line([[left-11,top+8],[left+11,top-8]],"#c6af7c",10);});
      for (let index = 0; index < 20; index++) {
        const left = 60 + index * 44;
        const top = 300 + (index % 2 ? 60 : -12) + Math.sin(index * .7) * 12;
        if (left > 145 && !root.Zubak.places.some(place => Math.hypot(left-place.x*9.6,top-(place.y*5.4-15)) < 58)) house(left,top,index%3===0 ? "cottage" : "house",.6);
      }
      house(355,351,"school",.65); lettering("KULTURNY DOM",355,311,"#e7e6c3",8);
      poly([[73,298],[83,278],[93,298]],"#8d6248"); rect(76,288,14,12,"#e1d8b8"); rect(81,291,4,9,"#554b3c"); rect(82,280,2,7,"#ded6bd"); rect(79,282,8,2,"#ded6bd"); lettering("KAPLNKA PRI CESTE",94,239,"#e7e6c3",7);
      rect(193,343,17,26,"#508d6c"); line([[195,345],[208,345],[208,367],[195,367],[195,345]],"#d9e5be",1);
      lettering("BEDNARI",89,472,"#e7e6c3",10);
      root.Zubak.places.slice().sort((first, second) => first.y - second.y).forEach(place => house(place.x * 9.6, place.y * 5.4 - 15, place.kind, .92));
      [[125,410],[314,439],[713,450],[825,318]].forEach(([left,top])=>leafyTree(left,top,.65));
      line([[480,367],[480,380],[522,380]],"#805b43",4); rect(480,365,3,18,"#a5ad8b"); rect(520,365,3,18,"#a5ad8b"); rect(484,369,35,10,"#d6ceaa");
      fence(323, 407, 65, .45); fence(755, 388, 52, .45);
      for (let index = 0; index < 120; index++) { const left = (index * 67) % 960; const top = 340 + (index * 41) % 200; rect(left, top, 2, 2, index % 3 ? "#c7ca8e" : "#e6ca82"); }
    } else {
      rect(0, 301, 960, 239, "#9ba66d"); poly([[0, 450], [380, 367], [610, 366], [960, 430], [960, 540], [0, 540]], "#c3ba88");
      texture(0,305,960,230,1900,"#314e3b24",6);
      texture(0,375,960,165,900,"#f7eac538",3);
      for(let grass=0;grass<160;grass++) {
        const left=(grass*137+29)%960;
        const top=330+(grass*67)%204;
        if(left<280||left>720) line([[left-2,top+2],[left,top-3],[left+1,top+1]],grass%2 ? "#486b464d" : "#d8dc9c66",.65);
      }
      if (tallerTrees) {
        const forestTrees = [
          [173,273,1.8], [699,281,1.7], [359,289,1.9],
          [78,300,2.4], [220,304,.85], [939,309,2.3], [269,316,2.5],
          [650,319,1.05], [112,326,.95], [742,329,2.8], [409,338,2.2],
          [463,343,.8], [15,353,3], [864,356,.9], [908,367,2.7]
        ];
        forestTrees.forEach(([left, top, size], index) => tree(left, top, size, index % 2));
      } else {
        for (let index = 0; index < (leftTreesOnly ? 6 : 25); index++) {
          tree(index * 47 - 30, 310 + index % 3 * 13, .8 + index % 3 * .13, index % 2);
        }
      }
      for (let index = 0; index < 120; index++) rect((index * 83) % 960, 334 + (index * 31) % 180, 3, 2, index % 3 ? "#aeb77a" : "#e6cf8c");
      for (let stone = 0; stone < 60; stone++) {
        const left = (stone * 113 + 37) % 960; const top = 438 + (stone * 29) % 98;
        rect(left,top,4+stone%5,2,"#8e97774a");rect(left+1,top-1,3,1,"#e4d7ac77");
      }
    }
  }
  function scene(place, state, time, player) {
    landscape(time, false, place.id === "nursery", place.kind === "tower");
    const kind = place.kind;
    if (kind === "church") {
      context.save();context.translate(45,0);
      oval(755,389,99,13,"#263b3233");
      rect(677,373,157,15,"#929384");
      rect(681,301,149,74,"#69513f");
      for (let beam = 0; beam < 10; beam++) {
        rect(678,303+beam*7,155,3,beam%2 ? "#967957" : "#82664b");
        rect(678,306+beam*7,9,3,"#b39a73");
        rect(824,306+beam*7,9,3,"#b39a73");
      }
      poly([[667,303],[708,252],[802,252],[845,303]],"#4d514c");
      line([[668,303],[845,303]],"#898b79",4);
      [266,278,290].forEach(top => line([[700-(top-266)*.8,top],[814+(top-266)*.8,top]],"#747b6e",2));
      rect(795,246,12,25,"#a99d87");rect(792,244,18,5,"#cec3aa");
      [696,782].forEach(left => {
        rect(left,319,32,34,"#f1f3eb");rect(left+4,323,24,26,"#8cb4b8");
        rect(left-2,352,36,4,"#dce2d8");
      });
      rect(742,326,25,49,"#423d32");rect(746,330,17,42,"#917456");rect(758,349,3,3,"#c5b879");
      context.restore();
    }
    if (place.id === "bednari") {
      oval(750,327,25,4,"#263b3233");
      line([[733,309],[725,301],[724,295]],"#826448",4);
      oval(747,312,17,9,"#a78459");
      [737,755].forEach(left => { rect(left,315,4,12,"#826448");rect(left,325,7,3,"#c3a576"); });
      oval(764,302,8,9,"#b59266");
      poly([[759,296],[758,305],[754,300]],"#594b3b");
      oval(771,305,5,3,"#c8ad82");oval(775,304,2,2,"#343c32");
      oval(767,300,1,1,"#26382e");
    }
    if (place.id === "cousin") {
      const paving = new Path2D("M 315 320 L 685 320 L 780 458 L 237 458 Z");
      context.save();context.clip(paving);
      rect(237,320,543,138,"#b2b4a8");
      for (let row = 0; row < 10; row++) {
        const top = 320+row*15;
        line([[237,top],[780,top]],"#868f84",1);
        for (let column = 0; column < 20; column++) {
          const left = 230+column*31+row%2*15;
          line([[left,top],[left+3,top+15]],"#91998c",1);
          rect(left+5,top+3,19,1,"#cbd0c1");
        }
      }
      context.restore();
      line([[315,320],[237,458],[780,458],[685,320]],"#7f897b",3);
    }
    if (place.id === "home") {
      [165,285,645,750].forEach((left,index) => {
        leafyTree(left,300+index%2*13,1.8);
        for (let fruit=0;fruit<9;fruit++) oval(left-27+fruit*17%58,209+index%2*13+fruit*11%47,2.4,2.8,index%2 ? "#d3b451" : "#bd6650");
      });
      oval(112,350,18,9,"#ab8860");
      line([[103,354],[99,374]],"#82694e",3);
      line([[123,354],[128,374]],"#82694e",3);
      line([[122,348],[133,329]],"#ab8860",8);
      oval(136,327,8,5,"#ba9b71");
      poly([[131,325],[129,313],[137,324]],"#ab8860");
      oval(140,326,1,1,"#263e32");
    }
    if (["forest", "spring", "ridge", "cross"].includes(kind)) {
      for (let index = 0; index < 9; index++) {
        if (kind === "spring" && (index === 3 || index === 4)) continue;
        tree(index * 120 + 20, 382 + index % 2 * 26, 2.2, index % 2);
      }
      if (kind === "forest") {
        poly([[300, 540], [440, 335], [507, 335], [730, 540]], "#c3b48c");
        for (let step = 0; step < 5; step++) { rect(448 + step * 12, 380 + step * 18, 10, 6, "#746d50"); }
        line([[91,354],[224,369],[337,391],[462,398],[573,422]],"#766f5c",9); line([[91,349],[224,364],[337,386],[462,393],[573,417]],"#b0a58a",3);
        for(let sleeper=0;sleeper<9;sleeper++){const left=111+sleeper*51,top=353+sleeper*7;line([[left,top-5],[left+5,top+9]],"#5f5547",4);}
        rect(755, 302, 45, 22, "#635948"); rect(788, 293, 22, 20, "#635948"); rect(792, 290, 6, 6, "#635948"); rect(760, 320, 8, 11, "#514d40"); rect(789, 320, 8, 11, "#514d40");
      }
      if (kind === "spring") {
        line([[785,54],[785,30]],"#e2dfce",1.5);
        rect(786,31,18,6,"#f3f2e9");
        rect(786,37,18,6,"#d24d48");
        poly([[786,31],[795,37],[786,43]],"#285897");
        lettering("Končitá (817 m n. m.)", 795, 24, 11.5, "#17251e");
        house(430,370,"spring",3.2);
        line([[482,408],[559,432],[694,440],[960,505]],state.flags.waterFixed ? "#6baab2" : "#777d5d",12);
        line([[478,355],[478,397+Math.sin(time*3)*2]],"#b2ddd5",5);
        if (state.flags.waterFixed) line([[482,408],[559,432],[694,440],[960,505]],"#b2d3bb",4);
        for (let drop = 0; drop < 4; drop++) {
          const top = 359 + (time * 22 + drop * 10) % 39;
          line([[477,top],[478,top+4]],"#edf8e8",1.5);
        }
        for (let ripple = 0; ripple < 4; ripple++) {
          const progress = (time * 18 + ripple * 39) % 156;
          line([[493+progress,411+progress*.22],[503+progress,414+progress*.22]],"#d7e8d2",1.5);
        }
        oval(516,405,11,3,"#344b3b66");
        line([[523,390],[529,391],[529,399],[524,400]],"#8d9991",2);
        poly([[507,389],[523,389],[521,404],[509,404]],"#c6d0c8");
        oval(515,389,8,2,"#71877f");
        line([[510,393],[510,401]],"#eef0df",1);
        poly([[164,540],[207,484],[242,444],[280,393],[310,366],[336,366],[305,408],[282,455],[308,496],[358,540]],"#89775e");
        line([[198,530],[246,477],[260,441],[303,380]],"#ab9571",9);
        [[226,492],[262,463],[287,417],[305,395],[282,507]].forEach(([left,top]) => {
          oval(left,top,9,3,"#625b47");
          line([[left-5,top-2],[left+3,top-1]],"#bbab84",1);
        });
        rect(217,439,10,60,"#666b64");
        rect(215,437,14,5,"#c1c6bc");
        context.save(); context.translate(222,455);
        if (!place.locked) context.rotate(-Math.PI / 2);
        rect(0,-3,78,6,"#dcded4");
        for (let stripe = 0; stripe < 4; stripe++) rect(stripe*20,-3,9,6,"#ac5850");
        context.restore();
      }
      if (kind === "cross") {
        poly([[352,540],[535,353],[568,280],[594,280],[581,363],[478,540]],"#81877c");
        poly([[361,540],[541,356],[572,280],[590,280],[575,360],[468,540]],"#c4c6bc");
        line([[361,540],[541,356],[572,280]],"#e0dfd1",2);
        line([[468,540],[575,360],[590,280]],"#a1a79a",2);
        [[[390,510],[486,510]],[[426,472],[508,472]],[[461,434],[530,434]],[[497,396],[552,396]],[[541,351],[575,355]],[[557,316],[584,319]]].forEach(points => line(points,"#929b8d",1.4));
        house(520,325,"cross",3);
      }
    } else if (kind === "tower") {
      context.save();
      context.translate(600,387);
      context.scale(1,.95);
      context.translate(-600,-387);
      house(600, 387, "tower", 3.25);
      context.restore();
      poly([[262,455],[410,455],[448,498],[220,498]],"#807259");
      rect(252,449,166,7,"#65513c");rect(271,425,126,5,"#876c4d");
      line([[268,431],[268,451],[409,451],[409,431]],"#5b4b37",3);
      for(let rail=0;rail<12;rail++) rect(270+rail*12,432,2,18,"#b4996c");
      if (!state.inventory.includes("notes")) {
        poly([[346,442],[370,440],[376,448],[351,450]],"#fff2cd");
        line([[352,444],[369,443]],"#776c58",1); line([[355,447],[371,446]],"#776c58",1);
        oval(369,446,4,2,"#aaa18b");
      }
      [274,394].forEach(left => {
        rect(left,456,7,23,"#5b5140");
        line([[left-5,479],[left+12,479]],"#71644b",4);
      });
    }
    else if (kind === "well") {
      rect(0,0,960,540,"#294b3b");
      for (let index=0;index<25;index++) tree(index*43-30,235+index%4*24,3.8,index%2);
      for (let index=0;index<13;index++) leafyTree(index*86-35,310+index%3*26,3.2);
      poly([[0,371],[220,346],[448,374],[710,351],[960,375],[960,540],[0,540]],"#566448");
      texture(0,355,960,185,2200,"#b9ad763b",71);
      poly([[470,540],[470,448],[448,408],[480,382],[532,385],[564,424],[526,466],[550,540]],"#968969");
      for (let index=0;index<7;index++) {
        tree(index*78-20,430+index%2*43,2.7,index%2);
        tree(675+index*63,435+index%2*41,2.9,index%2);
      }
      house(500,407,"well",3.2);
      if (state.flags.wellOpen) {
        poly([[452,400],[529,390],[554,416],[477,430]],"#27382f");
        poly([[459,404],[526,396],[546,415],[479,423]],state.flags.waterFixed ? "#6eaaa9" : "#182923");
        poly([[452,400],[452,354],[527,342],[529,390]],"#899582");
        line([[459,392],[459,361],[520,351]],"#b4beaa",3);
        rect(482,365,16,5,"#3c4d40");
      }
    }
    else if (kind === "festival") {
      rect(120, 289, 740, 92, "#6f9c68"); line([[120, 290], [860, 290], [860, 380], [120, 380], [120, 290]], "#d2d7a6", 3);
      house(315, 355, "festival", 3.1); house(700, 365, "festival", 2.5);
      line([[115, 214], [850, 221]], "#5b684f", 2); for (let flag = 0; flag < 17; flag++) poly([[120 + flag * 43, 214], [140 + flag * 43, 214], [130 + flag * 43, 234]], ["#d88769", "#e9c976", "#82b5ac"][flag % 3]);
      oval(500,460,66,8,"#334a3477");
      line([[467,423],[458,458]],"#514d3c",6); line([[532,423],[542,458]],"#514d3c",6);
      for (let flame = 0; flame < 5; flame++) poly([[469+flame*13,455],[476+flame*13,433-Math.sin(time*5+flame)*4],[483+flame*13,455]],flame%2?"#f0c05e":"#d76a43");
      oval(500,416,58,37,"#293d39"); oval(500,410,52,30,"#435a4e");
      oval(500,395,59,15,"#859883"); oval(500,396,50,9,"#a25735");
      line([[442,399],[432,397],[432,409],[445,410]],"#354b42",5); line([[557,399],[568,397],[568,409],[555,410]],"#354b42",5);
      for (let steam = 0; steam < 3; steam++) rect(480 + steam * 18, 369 - Math.sin(time * 2 + steam) * 8, 5, 16, "#ebebca99");
    } else if (kind === "bus") {
      rect(752,300,146,101,"#d8d1b7");
      poly([[742,300],[769,274],[881,274],[909,300]],"#866957");
      rect(765,316,37,32,"#819f9c"); rect(845,316,37,32,"#819f9c");
      rect(810,337,25,64,"#6f786c"); rect(806,304,33,12,"#d0a956");
      lettering("POŠTA",822,313,7,"#30443b");
      line([[230,399],[710,399]],"#b8aa84",12);
      rect(305,296,285,12,"#805b43"); rect(320,308,9,91,"#a5ad8b"); rect(566,308,9,91,"#a5ad8b");
      rect(336,317,224,75,"#d6ceaa"); rect(349,329,198,51,"#829b93"); rect(366,339,164,34,"#b7c8b7");
      [390,450,510].forEach((left, index) => {
        person(left,394,["#a6647e","#608b9b","#bba65b"][index],.72);
        line([[left-4,361],[left-1,361]],"#493e38",1.4);
        line([[left+3,361],[left+6,361]],"#493e38",1.4);
        line([[left-2,367],[left+3,367]],"#735649",1);
        line([[left-8,374],[left+3,379],[left+8,374]],"#ebbc8b",3);
        rect(left,373,7,10,"#344b50"); rect(left+1,374,5,6,"#a6c4bd");
      });
      lettering("Znudené decká",460,332,12,"#354e46");
      rect(595,336,82,61,"#e0d9bd"); lettering("ZASTÁVKA ZUBÁK",636,330,7,"#41574e");
      rect(600,341,72,51,"#f6f3e7");
      lettering("CESTOVNÝ PORIADOK",636,348,5,"#354d46");
      line([[603,351],[669,351]],"#63766b",.7);
      [616,638,656].forEach(left => line([[left,353],[left,389]],"#a3aba0",.4));
      for (let row = 0; row < 5; row++) {
        const top = 355 + row * 6;
        if (row % 2 === 0) rect(603,top-2,66,5,"#e2e8de");
        lettering(["05:20","06:45","08:10","10:05","13:30"][row],609,top+2,3.8,"#354d46");
        for (let column = 0; column < 3; column++) {
          const left = 620 + column * 16;
          line([[left,top],[left+5+(row+column)%4,top]],"#69796e",.7);
          line([[left,top+2],[left+3+(row*2+column)%5,top+2]],"#89958a",.5);
        }
        line([[603,top+4],[669,top+4]],"#bac1b6",.4);
      }
    }
    else {
      if (place.id === "office") {
        context.save(); context.translate(830,399); context.scale(1.1,1.1); context.translate(-830,-399);
        rect(748,299,162,100,"#c4c6b8");
        poly([[738,299],[763,273],[894,273],[919,299]],"#66756e");
        rect(761,317,44,35,"#739792"); rect(855,317,42,35,"#739792");
        rect(816,337,28,62,"#526b64"); rect(793,303,75,10,"#e5e3d3");
        lettering("POSILOVŇA",830,311,7,"#344e43");
        context.restore();
      }
      house(510, 366, kind, kind === "church" ? 2.6 : kind === "office" ? 4.7 : 4.1); if (place.id === "home") { rect(675, 395, 125, 33, "#426775"); rect(693, 373, 78, 28, "#507986"); rect(705, 377, 51, 17, "#b9d1c5"); rect(689, 422, 20, 21, "#34443e"); rect(767, 422, 20, 21, "#34443e"); }
    }
    if (place.id === "home") {
      oval(321,434,61,9,"#263b3233");
      rect(273,350,96,59,"#43382f"); rect(278,355,86,44,"#68503c");
      rect(281,358,80,31,"#795e45"); rect(285,362,72,23,"#624a37");
      rect(270,347,102,6,"#a18158"); rect(273,353,96,2,"#c29b67");
      rect(289,366,64,3,"#a18056"); rect(295,370,52,16,"#3e352c");
      poly([[301,367],[320,369],[320,384],[301,382]],"#f0e5c7");
      poly([[321,369],[340,367],[340,382],[321,384]],"#e2d5b3");
      [373,377,381].forEach(top => line([[304,top],[316,top+1]],"#8a8d7b",.6));
      [373,377,381].forEach(top => line([[325,top+1],[337,top]],"#8a8d7b",.6));
      rect(275,390,92,5,"#322e29"); rect(277,395,88,11,"#fff2d6");
      for (let key = 1; key < 14; key++) line([[277+key*6.28,395],[277+key*6.28,406]],"#9e9a87",.7);
      for (let key = 0; key < 14; key++) {
        if ([0,1,3,4,5].includes(key%7)) rect(281+key*6.28,394,3.8,7,"#282e2b");
      }
      rect(273,406,96,5,"#96734c"); rect(277,411,7,18,"#49392d"); rect(358,411,7,18,"#49392d");
      rect(307,419,5,4,"#c5ad6b"); rect(321,419,5,4,"#c5ad6b");
      rect(298,430,48,7,"#664d39"); rect(301,437,5,12,"#49392d"); rect(337,437,5,12,"#49392d");
    }
    if (kind === "tower") {
      tree(788,326,1.05,0);
      tree(887,337,1.2,1);
      oval(831,344,43,9,"#344936");
      line([[835,340],[856,345],[873,344]],"#414d54",9);
      line([[854,345],[867,353],[879,351]],"#414d54",7);
      line([[873,344],[882,343]],"#303a32",5);
      line([[879,351],[887,350]],"#303a32",5);
      poly([[809,328],[826,326],[843,338],[837,348],[815,343]],"#df80a8");
      line([[821,329],[832,341]],"#f0adca",2);
      line([[815,336],[807,345],[821,348]],"#c6b3bd",5);
      oval(802,328,10,9,"#b8b2a1");
      oval(804,331,7,7,"#dfb995");
      poly([[793,326],[798,317],[809,318],[813,325],[802,323]],"#c5bca6");
      context.save();
      context.translate(29,30);
      line([[789,327],[796,309],[813,301],[831,307],[843,325]],"#5b4938",10);
      line([[792,324],[800,310],[813,305],[828,310],[839,323]],"#9b815b",3);
      line([[811,302],[807,292],[811,282]],"#66533c",5);
      line([[831,308],[845,300],[853,301]],"#66533c",4);
      context.restore();
      for (let puff=0;puff<7;puff++) {
        const drift=(time*26+puff*17)%116;
        const left=106-drift;
        const top=426-drift*.38-puff%2*7;
        const size=13+drift*.18;
        poly([[left-size,top],[left-size*.6,top-size],[left+size*.4,top-size],[left+size,top],[left+size*.5,top+size*.5],[left-size*.7,top+size*.4]],"#56595388");
      }
      context.save(); context.translate(-120, 0);
      poly([[65,421],[102,350],[238,346],[294,386],[327,397],[327,444],[65,444]],"#353e3d");
      poly([[107,356],[165,353],[165,391],[92,391]],"#a4bcc0");
      poly([[174,353],[233,352],[279,389],[174,389]],"#809fa7");
      rect(67,397,259,34,"#4a5552");rect(169,350,6,77,"#293432");
      rect(92,433,49,49,"#202925");rect(250,433,49,49,"#202925");
      rect(103,444,27,27,"#9ca69b");rect(261,444,27,27,"#9ca69b");
      rect(70,435,17,6,"#343d38");rect(307,402,17,12,"#ede0b1");
      rect(179,402,17,4,"#aeb7a7");rect(61,431,13,5,"#202925");
      context.restore();
      line([[730,540],[681,478],[655,426]],"#817455",12);
      line([[817,540],[747,478],[710,426]],"#817455",12);
      for (let tread=0;tread<7;tread++) {
        const top=443+tread*14;
        line([[650+tread*9,top],[664+tread*9,top-5]],"#625d48",3);
        line([[706+tread*12,top],[720+tread*12,top-5]],"#625d48",3);
      }
      context.save(); context.translate(-355, -30);
      oval(838,423,45,17,"#6f735d"); oval(838,419,32,12,"#393d32");
      line([[820,424],[855,414]],"#72513c",7); line([[821,414],[855,425]],"#513c30",7);
      const flameHeight = Math.sin(time*7)*4;
      poly([[821,420],[827,400],[835,407],[841,388+flameHeight],[851,410],[855,421]],"#dc7439");
      poly([[832,422],[837,405],[842,410],[846,400+flameHeight],[849,422]],"#f5cb65");
      for(let stone=0;stone<9;stone++) {
        const angle=stone*Math.PI*2/9;
        oval(838+Math.cos(angle)*39,420+Math.sin(angle)*13,7,5,stone%2 ? "#b0ae98" : "#8a9080");
      }
      person(777,432,"#78805a",1.1); person(906,430,"#78a59b",1.1);
      context.save(); context.translate(777,432); context.scale(1.1,1.1);
      rect(-13,-33,5,7,"#78805a"); rect(9,-33,5,7,"#78805a");
      poly([[-9,-35],[-2,-36],[1,-31],[-4,-28],[-9,-30]],"#424c36");
      poly([[3,-35],[9,-33],[8,-27],[3,-29],[0,-32]],"#b1aa7a");
      poly([[-7,-25],[-1,-28],[3,-24],[0,-20],[-6,-21]],"#b1aa7a");
      poly([[4,-25],[9,-26],[9,-18],[4,-16],[1,-20]],"#424c36");
      poly([[-9,-19],[-5,-20],[-1,-16],[-3,-14],[-9,-14]],"#303e31");
      poly([[9,-52],[12,-49],[12,-43],[15,-38],[13,-35],[12,-39],[10,-43]],"#4c382a");
      poly([[12,-41],[14,-38],[14,-32],[12,-29],[10,-34],[11,-38]],"#4c382a");
      poly([[8,-50],[11,-48],[11,-42],[8,-40],[7,-44]],"#b99b78");
      oval(10,-43,1.8,2.4,"#eab38b");
      line([[10,-44],[10.5,-42]],"#b77f5e",.7);
      poly([[-9,-50],[-9,-54],[-6,-58],[-3,-57],[-1,-60],[2,-58],[5,-59],[8,-55],[9,-51],[4,-53],[-2,-53],[-6,-51]],"#4c382a");
      line([[-5,-55],[0,-56],[5,-54]],"#9c7951",1.1);
      line([[13,-39],[13,-34]],"#9c7951",1);
      line([[12,-37],[12,-33]],"#806044",.8);
      context.restore();
      line([[790,402],[832,405]],"#bda47a",2); line([[892,400],[846,406]],"#bda47a",2);
      line([[827,405],[836,405]],"#a74732",5); line([[843,406],[852,405]],"#a74732",5);
      context.restore();
      if (time % 12 >= 3 && time % 12 < 5.5) {
        const bubbleX = Math.floor(time / 12) % 2 ? 520 : 390;
        context.save();
        context.translate(bubbleX+33,335);
        context.scale(.6,.6);
        context.translate(-bubbleX-33,-335);
        rect(bubbleX,286,126,37,"#f4efd6");
        poly([[bubbleX+22,323],[bubbleX+33,335],[bubbleX+39,323]],"#f4efd6");
        lettering("Zdenooo!",bubbleX+63,311,19,"#283e33");
        context.restore();
      }
    }
    if (place.id === "nursery") {
      rect(420,369,62,7,"#463a33");
      line([[427,375],[427,412],[476,412],[476,375]],"#493b34",3);
      for(let step=0;step<4;step++) rect(419-step*7,411+step*7,66+step*14,6,step%2?"#9f9b87":"#c4bda2");
      line([[419,407],[419,432]],"#414942",2);line([[484,407],[484,432]],"#414942",2);
      oval(758,424,103,23,"#a6ae79");
      [687,739].forEach(left => {
        line([[left,418],[left,346],[left+43,346],[left+43,418]],"#b66f4c",5);
      });
      [346,368,391].forEach(top => {
        line([[687,top],[739,top],[782,top]],"#538e88",3);
        line([[730,top],[782,top]],"#538e88",3);
      });
      for (let rung = 0; rung < 5; rung++) line([[687,357+rung*12],[730,357+rung*12]],"#d7b85c",3);
      rect(735,367,50,6,"#a58455");
      poly([[781,370],[789,369],[835,415],[826,420]],"#d5a74e");
      line([[781,365],[790,364],[840,412]],"#8ca8a3",3);
      person(815,432,"#cf7d86",.58);
      person(701,435,"#689eb8",.61);
      person(760,368,"#d2b55a",.52);
      line([[755,349],[744,343],[739,346]],"#e2bc8e",2.5);
    }
    if (place.id === "shop") {
      poly([[315,408],[687,408],[747,453],[253,453]],"#aaa18b");
      line([[315,408],[253,453]],"#d1c7aa",3);line([[687,408],[747,453]],"#d1c7aa",3);
      for(let step=0;step<6;step++) poly([[323-step*13,410+step*7],[678+step*13,410+step*7],[690+step*13,417+step*7],[309-step*13,417+step*7]],step%2?"#89836f":"#c6bea5");
      line([[308,411],[250,451]],"#6f776b",3);line([[694,411],[750,451]],"#6f776b",3);
    }
    if (place.id === "pub") {
      rect(417,316,55,37,"#66533d"); rect(421,320,47,29,"#e0d4ad");
      oval(437,433,24,6,"#648b39");
      oval(430,431,13,4,"#8eb84c");
      [[410,431],[418,439],[448,426],[460,435],[452,441]].forEach(([left,top]) => rect(left,top,3,2,"#a0bc51"));
      if (state.flags.pubOpen) {
        rect(478, 325, 36, 74, "#303f36"); rect(547, 374, 55, 45, "#947b53"); rect(566, 383, 20, 10, "#d1bd7c");
        poly([[612,355],[635,355],[640,389],[609,389]],"#387e72");
        rect(612,353,23,5,"#234c46");
        rect(614,363,20,17,"#f1ead4");
        oval(624,371,3,5,"#674738");
        line([[625,367],[623,375]],"#d6b98c",1);
      }
    }
    if (place.id === "mixer") {
      house(740, 392, "mixer", 2.5);
      if (!state.flags.transport || state.flags.equipmentReturned) {
        oval(606,438,57,9,"#263b3233");
        line([[587,399],[575,434],[625,434],[614,401]],"#506353",5);
        oval(577,435,10,10,"#303b35"); oval(577,435,4,4,"#aaa990");
        oval(626,435,10,10,"#303b35"); oval(626,435,4,4,"#aaa990");
        poly([[570,380],[596,362],[625,375],[632,398],[606,416],[580,404]],"#d98d3c");
        poly([[570,380],[596,362],[601,372],[577,389]],"#f0b65f");
        oval(620,389,14,20,"#9d642f"); oval(622,389,9,14,"#37453d");
        rect(558,397,16,15,"#647763");
        line([[571,409],[559,422]],"#506353",4);
        oval(646,403,13,13,"#506353"); oval(646,403,9,9,"#87947b");
        line([[633,402],[646,403],[651,395]],"#506353",3);
      }
    }
    if (["house","nursery","school","flats","office","shop","pub","mixer"].includes(kind)) {
      fence(40, 392, 143, .9); if (place.id !== "office") fence(790, 393, 135, .9);
      flowers(65,416,9,1.1);flowers(810,411,8,1.1);
      if (place.id === "nursery") {
        [12,69,126].forEach((left,index) => tree(left,408+index%2*15,3.2,index%2));
      } else { leafyTree(106,371,1.7); if (place.id !== "office") leafyTree(889,368,1.6); }
      rect(731,379,10,37,"#5a6c58");rect(725,373,22,10,"#899b71");rect(727,371,18,3,"#b0ba85");
      if (kind === "pub") { lettering("KRČMA",510,295,18,"#000000");rect(391,299,45,7,"#977957");rect(391,324,45,7,"#977957"); }
      if (place.id === "home") { rect(558,309,21,15,"#e8ddbd");lettering("NG",568,321,11,"#4a6154"); }
      if (place.id === "nursery" && state.flags.fenceChecked) {
        context.save();context.translate(640,0);
        oval(222,425,57,7,"#263b3233");
        line([[189,398],[231,414],[269,397]],"#586650",4);
        line([[220,401],[211,423],[238,423],[237,404]],"#586650",3);
        oval(191,416,13,13,"#303b35"); oval(191,416,6,6,"#a6aa87");
        poly([[178,376],[239,376],[232,398],[198,404]],"#d9b737");
        poly([[178,376],[192,369],[249,370],[239,376]],"#f0d261");
        poly([[192,373],[240,373],[233,380],[200,384]],"#9e8a38");
        line([[240,398],[270,389]],"#586650",4);
        rect(258,372,10,19,"#496452"); rect(251,386,17,7,"#3a5143");
        context.restore();
      }
      if (place.id === "home") {
        poly([[395,410],[626,410],[645,451],[375,451]],"#a99d7b");
        rect(405,329,202,6,"#705b43");
        poly([[405,330],[607,330],[637,360],[380,360]],"#95674c");
        for (let seam=0;seam<10;seam++) line([[408+seam*21,332],[385+seam*27,358]],"#c7996c",1);
        line([[380,361],[637,361]],"#d0ac76",5);
        [390,624].forEach(left => { rect(left,363,7,82,"#7e7252");rect(left+1,365,2,76,"#baa67a"); });
        [409,548].forEach(left => {
          rect(left,392,65,6,"#a58a5d");rect(left,403,65,6,"#a58a5d");
          rect(left-3,420,71,7,"#bc9c69");
          [left+5,left+54].forEach(leg => rect(leg,427,5,16,"#79694a"));
        });
        rect(416,394,43,9,"#9d5a48");rect(414,391,47,5,"#bf8063");
        flowers(420,381,3,.8);
        line([[601,232],[606,232],[606,391],[616,398]],"#716e62",3);
        line([[602,233],[602,389]],"#c6c5a7",.7);
        rect(518,367,28,2,"#493e3266");rect(522,369,29,2,"#493e3244");
        texture(677,402,115,23,70,"#b4d9d733",2);
        line([[698,375],[758,375],[774,397]],"#b1d2cb",1);
      }
      if (place.id === "office") {
        portrait(394,241,false);portrait(568,241,true);
        context.save(); context.translate(325,419); context.rotate(-.08);
        [-42,42].forEach(left => {
          oval(left,0,24,24,"#293d39"); oval(left,0,20,20,"#a9b5a3");
          oval(left,0,17.5,17.5,"#6b806b");
          const spokeAngle = left < 0 ? time * 1.8 : 0;
          line([[left-Math.cos(spokeAngle)*17,-Math.sin(spokeAngle)*17],[left+Math.cos(spokeAngle)*17,Math.sin(spokeAngle)*17]],"#c9d1bc",1);
          line([[left-Math.sin(spokeAngle)*17,Math.cos(spokeAngle)*17],[left+Math.sin(spokeAngle)*17,-Math.cos(spokeAngle)*17]],"#c9d1bc",1);
        });
        line([[-42,0],[-18,-35],[0,0],[-42,0]],"#438d8a",4);
        line([[-18,-35],[27,-35],[0,0]],"#438d8a",4);
        line([[27,-35],[42,0]],"#344b48",4);
        line([[-18,-35],[-21,-45]],"#45564d",3);
        line([[-30,-45],[-12,-45]],"#283d38",5);
        line([[27,-35],[23,-49],[34,-51]],"#344b48",3);
        line([[0,0],[10,6]],"#c4c6ac",3); rect(7,4,10,3,"#293d39");
        line([[5,-10],[21,-28]],"#293e3b",9);
        line([[8,-11],[21,-26]],"#b5c5af",2);
        oval(0,0,6,6,"#344b48");
        context.restore();
      }
      if (kind === "school" || kind === "flats") house(798,332,kind === "school" ? "flats" : "school",1.7);
    }
    if (place.id === "nursery") {
      poly([[960,475],[502,468],[452,477],[485,498],[960,509]],"#a6a793");
      poly([[960,479],[503,473],[465,478],[488,492],[960,503]],"#858b85");
      line([[474,480],[377,477],[247,486],[115,478],[0,484]],"#b3af86",9);
      line([[473,487],[375,484],[246,493],[114,485],[0,491]],"#b3af86",7);
      fence(653,452,222,.85);
      fence(800,441,140,.8);
    }
    if (place.id === "bednari") {
      oval(325,445,48,7,"#263b3233");
      line([[289,436],[343,403],[351,436]],"#64716a",4);
      line([[343,436],[293,399],[274,393]],"#64716a",4);
      line([[270,393],[282,395]],"#303e39",5);
      poly([[287,392],[356,392],[345,418],[301,418]],"#8d778e");
      oval(337,390,21,24,"#a28ba0");
      poly([[316,370],[337,366],[354,378],[358,394],[316,394]],"#a28ba0");
      poly([[318,376],[331,373],[338,380],[339,394],[316,394]],"#4d5158");
      line([[289,395],[355,395]],"#c2afbd",3);
      [294,349].forEach(left => { oval(left,437,10,10,"#303e39");oval(left,437,4,4,"#aeb7a7"); });
    }
    if (kind === "cottage") {
      for(let treeIndex=0;treeIndex<3;treeIndex++) leafyTree(treeIndex*180-30,348+treeIndex%2*22,1.8);
      poly([[755,305],[960,285],[960,540],[814,540],[785,433]],"#71865c");
      for (let row = 0; row < 3; row++) {
        for (let treeIndex = 0; treeIndex < 7; treeIndex++) {
          tree(790+treeIndex*32+row*14,328+row*62+treeIndex%3*9,1.05+row*.35,(treeIndex+row)%2);
        }
      }
      const brook = [[754,310],[746,345],[759,380],[750,417],[770,458],[783,497],[798,540]];
      line(brook,"#667657",12);line(brook,"#679f9e",5);line(brook,"#b9d8c6",1.4);
      [[750,350],[754,402],[768,456],[787,510]].forEach(([left,top]) => {
        oval(left-7,top+3,4,2,"#8b9580");
        line([[left-1,top],[left+2,top+3]],"#e1ead5",1);
      });
      oval(672,438,53,7,"#263b3233");
      rect(632,399,79,6,"#a78555");rect(632,408,79,6,"#b39562");
      rect(629,418,85,7,"#a78555");
      if (!state.inventory.includes("phone") && !state.flags.phoneReturned) {
        rect(670,408,14,20,"#263e3a"); rect(672,410,10,14,"#83b4af");
        rect(674,412,3,7,"#c9e6d8"); oval(677,426,1,1,"#d9d4b8");
      }
      [640,700].forEach(left => { rect(left,397,5,39,"#615943");rect(left-3,424,5,15,"#615943"); });
      line([[418,295],[452,313]],"#9f875b",9);line([[411,322],[449,300]],"#b49a6d",8);
      flowers(320,408,12,1.3);flowers(718,455,6,.7);
    }
    if(kind === "festival") {
      for(let guest=0;guest<7;guest++) person(150+guest*99,345+guest%2*15,["#a6809a","#8aab99","#c0a463"][guest%3],.65);
      [[230,400],[720,422]].forEach(([left,top])=>{rect(left,top,90,8,"#ac8c5a");rect(left+9,top+8,6,20,"#716e4b");rect(left+75,top+8,6,20,"#716e4b");rect(left+10,top-6,9,6,"#e3d4a9");rect(left+48,top-7,12,7,"#d7c7a2");});
      lettering("GULÁŠFEST",304,271,17);flowers(60,470,9,1);
    }
    if(["forest","spring","ridge","cross","tower","well"].includes(kind)) {
      if (kind !== "tower") leafyTree(64,429,2.1);
      if (kind !== "tower") leafyTree(905,440,2.2);
      flowers(125,469,9,1);flowers(738,479,10,1.1);
      [[755,453],[110,488]].forEach(([left,top])=>{poly([[left-13,top],[left-7,top-10],[left+7,top-12],[left+17,top-1],[left+9,top+5]],"#8b9585");line([[left-7,top-10],[left+7,top-12],[left+13,top-5]],"#c4c6a9",2);});
    }
    if (place.id === "cousin") {
      context.save();
      context.translate(state.flags.dogSafe ? 672 : 710, state.flags.dogSafe ? 307 : 405);
      context.scale(state.flags.dogSafe ? .58 : 1.15, state.flags.dogSafe ? .58 : 1.15);
      oval(5,35,72,12,"#243d3244");
      line([[-48,-8],[-70,-34],[-76,-54]],"#805a3b",13);
      oval(0,-9,55,31,"#a97a4e"); oval(5,-20,38,19,"#493f35");
      [-35,29].forEach(left => {
        rect(left,4,14,34,"#a97a4e"); oval(left+5,37,14,6,"#d6b486");
      });
      oval(43,-36,25,30,"#b58a59");
      poly([[24,-50],[25,-84],[45,-61]],"#514235");
      poly([[49,-59],[66,-80],[64,-43]],"#514235");
      oval(64,-28,23,13,"#d9b88a"); oval(83,-32,7,6,"#28342d");
      oval(51,-45,4,4,"#202c26"); oval(52,-46,1.3,1.3,"#fff5cf");
      line([[38,-14],[59,-9]],"#b84b42",7);
      rect(53,-7,7,10,"#d8bc61");
      context.restore();
      fence(618,448,205,1.2);
    }
    (place.visiblePeople || place.people).forEach((id, index) => {
      const position = place.personPositions[id] || [245 + index * 215, 431 + index % 2 * 6];
      const [left, top] = position;
      context.save();
      if (id === "mayor") {
        context.translate(left, top);
        context.rotate(.12 + Math.sin(time * 2.4) * .035);
        context.translate(-left, -top);
      }
      person(left, top, root.Zubak.people[id].color, id === "fifko" ? .9 : 1.3, false, 0, id === "tato" ? "#b18457" : undefined);
      context.restore();
      if (id === "mayor") {
        const repairMotion = Math.sin(time * 3.2) * 7;
        line([[left+7,top-38],[left+35,top-22],[left+63,top-21+repairMotion]],"#789da2",10);
        oval(left+63,top-21+repairMotion,5,5,"#dbb58c");
        line([[left+62,top-20+repairMotion],[left+77,top-9+repairMotion]],"#ccd2c5",4);
        oval(left+79,top-7+repairMotion,5,5,"#ccd2c5");
        oval(left+79,top-7+repairMotion,2.5,2.5,"#344b48");
      }
      if (id === "mama") {
        mamaHair(left, top, 1.3);
      }
      if (id === "ondrej") {
        context.save(); context.translate(left,top); context.scale(1.3,1.3);
        poly([[-10,-55],[-7,-66],[5,-67],[10,-55]],"#48613c");
        rect(-15,-56,30,4,"#354c31"); rect(-8,-59,17,3,"#826843");
        line([[6,-64],[10,-73]],"#c6c397",1.5);
        poly([[-7,-35],[0,-30],[7,-35],[5,-24],[-5,-24]],"#657c4d");
        line([[0,-30],[0,-15]],"#2e4932",1.5);
        rect(-8,-25,6,6,"#365337"); rect(3,-25,6,6,"#365337");
        [ -27,-22,-17 ].forEach(height => oval(0,height,1,1,"#c9b57d"));
        rect(-8,-16,17,3,"#66523b"); rect(-1,-16,3,3,"#c4b57a");
        [-10,3].forEach(left => {
          rect(left,-5,8,14,"#303e38");
          rect(left-2,7,12,5,"#25332e");
          rect(left,-5,8,2,"#596b5b");
          poly([[left-2,8],[left+2,5],[left+4,8],[left+8,6],[left+10,10],[left+9,12],[left-2,12]],"#857153");
          rect(left+1,0,3,3,"#a08b65");
          oval(left+6,4,2,2,"#786343");
        });
        context.restore();
      }
      if (id === "warden") {
        context.save(); context.translate(left,top); context.scale(1.3,1.3);
        rect(-13,-33,5,14,"#344f48"); rect(9,-33,5,14,"#344f48");
        poly([[-10,-35],[-5,-38],[0,-32],[5,-38],[10,-35],[9,-16],[-9,-16]],"#344f48");
        line([[-5,-37],[0,-30],[5,-37]],"#d7d4be",1.5);
        rect(-10,-35,7,3,"#a8a06a"); rect(3,-35,7,3,"#a8a06a");
        rect(-7,-27,5,4,"#273f39"); rect(3,-27,5,4,"#273f39");
        poly([[3,-32],[7,-32],[7,-29],[5,-28],[3,-29]],"#ddc779");
        [-27,-23,-19].forEach(height => oval(0,height,.8,.8,"#d8c478"));
        rect(-9,-17,18,3,"#23332e"); rect(-2,-17,4,3,"#d8c478");
        poly([[-11,-54],[-8,-62],[8,-62],[11,-54]],"#344f48");
        rect(-12,-55,24,3,"#1d302d"); rect(-2,-60,4,4,"#ddc779");
        context.restore();
      }
    });
    if (!['festival','bus'].includes(kind)) {
      for(let blade=0;blade<60;blade++) {
        const left=(blade*71+19)%960;const top=514+(blade*13)%26;
        line([[left-4,top+7],[left-2,top-5],[left+2,top+5],[left+6,top-9]],blade%2?"#54754c":"#779258",2);
      }
    }
  }
  function draw(state, map, time, player, redrawBackground = true) {
    foreground.clearRect(0, 0, 960, 540);
    if (redrawBackground) {
      context.clearRect(0, 0, 960, 540);
      if (map) { landscape(time, true); const place = root.Zubak.places.find(value => value.id === state.location); person(place.x * 9.6 + 17, place.y * 5.4 - 15, "#bb6654", .65, true); }
      else scene(root.Zubak.scene(state), state, time, player);
    }
    if (map) return;
    const background = context;
    context = foreground;
    try {
      oval(player.x+12,player.y+3,28,6,"#283e3126");
      person(player.x, player.y, "#bb6654", 1.45, true, player.walking ? time : 0);
    } finally {
      context = background;
    }
  }
  function drawPanorama() {
    const sky = context.createLinearGradient(0, 0, 0, 350);
    sky.addColorStop(0, "#70b5d5"); sky.addColorStop(1, "#e4e6cc");
    rect(0, 0, 960, 540, sky);
    oval(774, 75, 29, 29, "#fff0bd");
    [[120,82,76],[382,55,92],[630,115,58]].forEach(([left,top,width]) => {
      oval(left,top,width,9,"#ffffff65"); oval(left+23,top-5,width*.58,12,"#ffffff70");
    });
    poly([[0,246],[55,211],[106,225],[170,147],[216,192],[270,126],[308,167],[355,99],[401,154],[446,132],[497,207],[549,168],[599,119],[647,167],[701,138],[751,194],[809,158],[869,215],[920,179],[960,207],[960,380],[0,380]],"#9cbbca");
    poly([[270,126],[249,157],[269,147],[283,156],[277,143]],"#e5e9e2");
    poly([[355,99],[326,139],[350,126],[362,138],[376,129]],"#f0eee3");
    poly([[599,119],[577,150],[600,139],[615,151]],"#e5e9e2");
    poly([[0,295],[80,257],[137,277],[218,214],[298,252],[379,209],[473,273],[549,225],[635,253],[728,209],[818,269],[902,236],[960,278],[960,410],[0,410]],"#799ca5");
    poly([[0,328],[97,285],[213,319],[326,267],[433,298],[514,343],[624,284],[740,308],[854,274],[960,319],[960,460],[0,460]],"#557e7c");
    poly([[0,368],[105,340],[211,356],[315,329],[439,375],[545,366],[681,337],[794,369],[960,348],[960,540],[0,540]],"#719265");
    poly([[313,376],[422,384],[520,371],[586,383],[469,419],[387,449],[278,492],[173,540],[49,540],[241,452]],"#b0b17a");
    line([[513,378],[469,396],[417,401],[387,429],[330,447],[297,473],[216,502],[172,540]],"#bed7ca",4);
    line([[560,385],[510,405],[473,430],[410,449],[385,476],[316,511],[300,540]],"#d7c89b",3);
    for (let houseIndex = 0; houseIndex < 24; houseIndex++) {
      const left = 358 + (houseIndex * 47 % 162);
      const top = 402 + (houseIndex * 19 % 62);
      rect(left,top,7,5,houseIndex%3 ? "#e7d8b0" : "#d2d7bd");
      poly([[left-1,top],[left+3,top-4],[left+8,top]],"#a86956");
    }
    texture(0,340,960,200,1800,"#203f3426",43);
    poly([[0,396],[116,382],[258,433],[324,540],[0,540]],"#365f49");
    poly([[960,383],[842,399],[751,458],[680,540],[960,540]],"#426c4d");
    for (let treeIndex = 0; treeIndex < 28; treeIndex++) {
      const left = treeIndex < 14 ? treeIndex*18-12 : 740+(treeIndex-14)*18;
      tree(left,465+(treeIndex*23%71),.65+(treeIndex%4)*.16,treeIndex%2);
    }
    rect(0,518,960,12,"#ab8154");
    line([[0,518],[960,518]],"#dfba7c",3);
    [35,308,638,915].forEach(left => rect(left,530,13,10,"#725b3f"));
  }
  root.ZubakArt = { draw, drawPanorama, drawCharacter };
})(globalThis);