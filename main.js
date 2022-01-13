
let keyres = ()=>{};

window.addEventListener("keydown",function(e){
    console.log(e);
    if(e.ctrlKey)return false;
    if(e.key === "ArrowLeft"){
        keyres("L");
    }else if(e.key === "ArrowRight"){
        keyres("R");
    }
});

const keyEvt = function(){
    return new Promise((res,rej)=>{
        keyres = res;
    });
};

let parseTime = function(t){
    t = t.split(":").map(a=>parseInt(a));
    return t[0]*60+t[1];
};
let formatTime = function(t){
    let s = t%60;
    let m = (t-s)%60;
    return m+":"+("0"+s).slice(-2);
};
let formatTimeJP = function(t){
    let s = t%60;
    let m = (t-s)/60;
    if(s === 0){
        return m+"分";
    }else{
        return m+"分"+s+"秒";
    }
};


let stages = `
説明    5:00 img/a.png
BOR移動 1:00 img/b.png
ワーク  14:00 img/c.png
BOR移動 1:00 img/d.png
発表    6:00 img/e.png
まとめ  3:00 img/f.png
`.trim().split("\n").map(l=>{
    l = l.trim().split(/\s+/);
    let time = parseTime(l[1]);
    //console.log(time);
    return {
        label:l[0],
        time:time,
        img:l[2]
    }
});

console.log(stages);



let main = async function(){
    let body = new ELEM(document.body);
    let BG = body.add("div","class:bg");
    let left = body.add("div","class:left");
    let label1 = left.add("div","class:lable1");
    let timeE = left.add("div","class:time");
    let right = body.add("div","class:right");
    let schedE = right.add("div","class:sched");
    let labels = [];
    for(let i = 0; i < stages.length; i++){
        let {label,time,img} = stages[i];
        let l = schedE.add("div",0,label+formatTimeJP(time));
        labels.push(l);
    }
    
    let i = 0;
    
    //contains the major sequence
    let sequence = async function(){
        for(; i < stages.length && i >= 0; i++){
            let {label,time,img} = stages[i];
            let labelE = labels[i];
            labelE.e.classList.add("focus");
            label1.setInner(label);
            let start = Date.now();
            while(true){
                let now = Date.now();
                let elapsed = Math.floor((now-start)/1000);
                timeE.setInner(formatTime(elapsed));
                
                let v = await Promise.race([Pause(10),keyEvt()]);
                if(v === "L"){
                    i-=2;
                    break;
                }else if(v === "R"){
                    break;
                }
            }
            labelE.e.classList.remove("focus");
            /*let v = await Promise.race(renderStage(stages[i]),keyEvt());
            if(v === "L"){
                i--;
            }*/
        }
    }
    
    while(true){
        label1.setInner("--");
        timeE.setInner("0:00");
        await keyEvt();
        await sequence();
        console.log(i);
        if(i < 0){
            i = 0;
        }else if(i >= stages.length){
            console.log("asdfasd");
            i = stages.length-1;
        }
    }
    
};

main();