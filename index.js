'use strict';

// ポケモンデータのパス
const POKEMONS_FILE = 'data/pokemons.json';
// 最大努力値
const MAX_EFFORT_VALUE = 252;
// レーダチャートの設定
const radarConfig = {
    type: 'radar',
    data: {
        labels: ['H', 'A', 'B', 'S', 'D', 'C'],
        datasets: [createChartData('種族値', [], '255, 99, 132')]  // 初期値：種族値
    },
    options: {
        elements: {
            line: {
                borderWidth: 3
            }
        }
    },
};
// セレクトボックス
const pokemonSelect = document.getElementById('pokemonSelect');
// ボタン
const switchBtn = document.getElementById('switchBtn');
// キャンバス
const radarCtx = document.getElementById('radarChart');
// レーダチャート
const radarChart = new Chart(radarCtx, radarConfig);
// ポケモンのデータ
let pokemons = null;

/**
 * ブラウザが読み込まれた最初の1回だけ実行されるイベントリスナ
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ポケモンのデータをファイルから取得し、pokemonsにセット
    pokemons = await loadPokemonData();
    // セレクトボックスに選択肢追加
    pokemons.forEach(pokemon => {
        const option = document.createElement('option');
        option.value = pokemon.id;
        option.text = pokemon.name;
        pokemonSelect.appendChild(option);
    });
    // レーダーチャート表示
    displayChart(1);  // 初期表示はID:1のポケモン
});

// セレクトボックスの変更イベントリスナ
pokemonSelect.addEventListener('change', () => {
    const selectedId = getSelectedPokemonId();
    // セレクトボックス変更時は一旦種族値表示に戻す
    displayChart(selectedId);
});

/**
 * 切替ボタンのイベントリスナ
 */
switchBtn.addEventListener('click', () => {
    // ポケモンのID取得
    const selectedId = getSelectedPokemonId();
    // 種族値データがセットされているときは、努力値データをセット
    if (radarConfig.data.datasets[0].label === '種族値') {
        displayChart(selectedId, 'EV');
    }
    // 努力値データがセットされているときは、種族値データをセット
    else {
        displayChart(selectedId);
    }
    // レーダーチャートの更新
    radarChart.update();
});

/**
 * ポケモンデータを読み込む
 * @returns array ポケモンデータの配列
 */
async function loadPokemonData() {
    const response = await fetch(POKEMONS_FILE);
    return await response.json();
}

/**
 * IDに対応するポケモンデータを取得
 * @param number id ポケモンID
 * @returns object ポケモンデータ
 */
function getPokemonById(id) {
    return pokemons.find(pokemon => pokemon.id === id);
}

/**
 * セレクトボックスで選択された値を取得
 * @returns number ポケモンID
 */
function getSelectedPokemonId() {
    return parseInt(pokemonSelect.value, 10);
}

/**
 * レーダーチャートの表示
 * @param number id ポケモンID
 * @param string chartMode チャートの表示形式（SB:種族値（初期値）、EV:努力値）
 */
function displayChart(id, chartMode = 'SB') {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    // 種族値のレーダーチャート設定
    if (chartMode === 'SB') {
        radarConfig.data.datasets = [createChartData('種族値', pokemon.baseStatus, '255, 99, 132')];
    }
    // 努力値のレーダーチャート設定
    else {
        radarConfig.data.datasets = [createChartData('努力値（%）', pokemon.effortValues.map(value => (value / MAX_EFFORT_VALUE) * 100), '54, 162, 235')];
    }
    // レーダーチャートの更新
    radarChart.update();
}

/**
 * レーダーチャートのデータ生成
 * @param string label ラベル
 * @param array data ポケモンのデータ
 * @param string color RGB(example: '255, 255, 255')
 */
function createChartData(label, data, color) {
    return {
        label: label,
        data: data,
        fill: true,
        backgroundColor: `rgba(${color}, 0.2)`,
        borderColor: `rgb(${color})`,
        pointBackgroundColor: `rgb(${color})`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `rgb(${color})`
    };
}