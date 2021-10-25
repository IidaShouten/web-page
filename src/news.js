async function callApi(){
    const url = 'https://script.google.com/macros/s/AKfycbx6bzcZ7HHwRWh9ieGrWiGTx2khsOUKXPhUNATQF2n3KThDLDILUCn8R-FGrrjm3DrzzQ/exec'; // リクエスト先URL

    const res = await fetch(url);
    const list = await res.json();
    var news = []
    console.log(list.length)
    for (var i = list.length-1;i>=0;i--){
        news.push(`<dt>${list[i].year}/${list[i].month}/${list[i].day}</dt>
        <dd>${list[i].message}</dd>`)
    }
        
    console.log(`<dl>${news.join("")}</dl>`)
    document.getElementById("news").innerHTML = `<dl>${news.join("")}</dl>`
}

callApi();