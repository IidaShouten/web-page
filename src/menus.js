
async function callApi(){
    const url = 'https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec'; // リクエスト先URL

    const res = await fetch(url);
    const list = await res.json();
    var sakana = [];
    var dango = [];
    var uokasi = [];
    var okiami = [];
    var other = [];
    var neriesa = [];
    var alive = [];
    var ebi = [];
    var sabiki = [];
    var honda = [];
    list.forEach(function(e){
        const url = e.url!="" ? e.url : e.img_url
        const menu = `
        <div class="col-lg-3  col-md-4 col-sm-6 col-xs-6">
            <a class="content-box" href=${url}>
                <div class="content-box-image">
                    <img src=${e.img_url}></img>
                </div>
            </a>
            <h3 class="content-box-title font-serif align-center">${e.name}</h3>
            <h4 class="content-box-title font-serif align-center">${e.price}</h4>
            <h4 class="content-box-title font-serif align-center">在庫 ${e.stock}</h4>
        </div>`

        
        if (!e.hasOwnProperty('category')){
            other.push(menu)
        }
        else if (e.category=="魚"){
            sakana.push(menu)
        }
        else if (e.category=="魚かし"){
            uokasi.push(menu)
        }
        else if (e.category=="ダンゴ"){
            dango.push(menu)
        }
        else if (e.category=="オキアミ"){
            okiami.push(menu)
        }
        else if (e.category=="練餌海道"){
            neriesa.push(menu)
        }
        else if (e.category=="活エサ"){
            alive.push(menu)
        }
        else if (e.category=="エビ"){
            ebi.push(menu)
        }
        else if (e.category=="サビキ"){
            sabiki.push(menu)
        }
        
        else if (e.category=="本多商店"){
            honda.push(menu)
        }

        else{
            other.push(menu)
        }
    });
        
        
    document.getElementById('魚').innerHTML =  sakana.join("")
    document.getElementById('魚かし').innerHTML =  uokasi.join("")
    document.getElementById('ダンゴ').innerHTML =  dango.join("")
    document.getElementById('オキアミ').innerHTML =  okiami.join("")
    document.getElementById('活エサ').innerHTML =  alive.join("")
    document.getElementById('練餌海道').innerHTML =  neriesa.join("")
    document.getElementById('その他').innerHTML =  other.join("")
    document.getElementById('エビ').innerHTML =  ebi.join("")
    document.getElementById('サビキ').innerHTML =  sabiki.join("")
    document.getElementById('本多商店').innerHTML = honda.join("")
};


callApi();


