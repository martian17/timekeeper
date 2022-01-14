
let keyres = ()=>{};

window.addEventListener("keydown",function(e){
    //console.log(e);
    if(e.ctrlKey)return false;
    if(e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "a" || e.key === "w"){
        keyres("L");
    }else if(e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "d" || e.key === "s"){
        keyres("R");
    }else if(e.key === " "){
        keyres("S");
    }
});

const keyEvt = function(){
    return new Promise((res,rej)=>{
        keyres = res;
    });
};

/*const waitKey = function(){
    let arr = [...arguments];
    return new Promise((res,rej)=>{
        let evtfunc = function(e){
            //console.log(e);
            if(e.ctrlKey)return false;
            if(arr.indexOf(e.key) === -1)return false;
            window.removeEventListener("keydown",evtfunc);
            res(e.key);
        };
        window.addEventListener("keydown",evtfunc);
    });
};*/

let Keys = new (function(){
    let cbs = {};
    window.addEventListener("keydown",function(e){
        let key = e.key;
        if(!(key in cbs))return;
        cbs[key].map(cb=>{
            cb(e);
        });
    });
    this.on = function(key,cb){
        cbs[key] = cbs[key] || [];
        cbs[key].push(cb);
        return {
            remove:()=>{
                cbs[key].splice(cbs[key].indexOf(cb),1);
            }
        }
    };
})();

let spaceEvt = (()=>{
    return {
        remove:()=>{
            
        }
    };
})();



let parseTime = function(t){
    t = t.split(":").map(a=>parseInt(a));
    return t[0]*60+t[1];
};
let formatTime = function(t){
    let s = t%60;
    let m = (t-s)/60;
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


/*let stages = `
説明    0:05 img/a.png
BOR移動 0:01 img/b.png
ワーク  0:14 img/c.png
BOR移動 0:01 img/d.png
発表    0:06 img/e.png
まとめ  0:03 img/f.png
`*/
let stages = `
説明    5:00 img/a.png
ワーク  15:00 img/c.png
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

let setCursorPosition = async function(elem,i){
    var rangeobj = document.createRange();
    var selectobj = window.getSelection();
    rangeobj.setStart(elem.childNodes[0], i);
    selectobj.removeAllRanges();
    selectobj.addRange(rangeobj);
};

let pauser = new Pauser();

let main = async function(){
    let body = new ELEM(document.body);
    let BG = body.add("div","class:bg");
    let left = body.add("div","class:left");
    let label1 = left.add("div","class:lable1");
    let timeE = left.add("div","class:time;");
    let right = body.add("div","class:right");
    let schedE = right.add("div","class:sched");
    let labels = [];
    let STATE = "";
    for(let i = 0; i < stages.length; i++){
        let {label,time,img} = stages[i];
        let l = schedE.add("div",0,label+formatTimeJP(time));
        labels.push(l);
    }
    
    //edit time functionality
    let clickfn = async (e)=>{
        if(STATE !== "SEQUENCE"){
            timeE.once("click",clickfn);
            return;
        }
        let [time,now] = await pauser.pause();//await ensures the break happens at the call point, ensuring the execution order
        timeE.attr("contenteditable",true);
        
        //focusing, and setting the caret position
        let elem = timeE.e;
        //e.focus();
        setCursorPosition(elem,elem.innerHTML.length);
        
        let enterEvt = timeE.on("keydown",(e)=>{
            if(e.key === "Enter"){
                time = parseTime(timeE.e.innerHTML);
                resume();
            }
        });
        
        let spaceEvt = Keys.on(" ",(e)=>{
            time = parseTime(timeE.e.innerHTML);
            resume();
        });
        
        let resume = function(){
            enterEvt.remove();
            spaceEvt.remove();
            pauser.resume(time,Date.now());
            timeE.attr("contenteditable",false);
            timeE.once("click",clickfn);
        }
    }
    timeE.once("click",clickfn);
    
    let i = -1;
    
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
                let remaining = Math.floor(time-(now-start)/1000);
                if(remaining <= 10){
                    timeE.style("color:#F00;");
                }else{
                    timeE.style("color:;");
                }
                timeE.setInner(formatTime(remaining));
                
                //edits the time if paused
                [time,start] = await pauser.wait(time,start);
                let v = await Promise.race([Pause(10),keyEvt()]);
                if(v === "L"){
                    i-=2;
                    break;
                }else if(v === "R"){
                    break;
                }else if(v === "S"){
                    //implementation in progress
                    //console.log("asdfasd");
                    //clickfn();
                }else if((now-start)/1000 > time){
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
        timeE.setInner("0:00");
        label1.style("font-size:5vw;color:#aaa;");
        if(i < 0){
            label1.setInner("↓キーで開始");
            let key = await keyEvt();
            if(key !== "R")continue;
            i = 0;
        }else if(i >= stages.length){
            label1.setInner("↑キーで戻る");
            let key = await keyEvt();
            if(key !== "L")continue;
            i = stages.length-1;
        }
        label1.style("font-size:;color:;");
        STATE = "SEQUENCE";
        await sequence();
        STATE = "";
    }
    
};

main();