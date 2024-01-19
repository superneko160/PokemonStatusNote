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
        datasets: [createChartData('種族値', [0, 0, 0, 0, 0, 0], '255, 99, 132')]  // 初期値：種族値
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
// テーブルの行
const tableRows = document.querySelectorAll('tbody tr');
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
    // レーダーチャートとテーブル表示（初期表示はID:1のポケモン）
    displayChart(1);
    displayTable(1);
});

/**
 * セレクトボックスの変更イベントリスナ
 */
pokemonSelect.addEventListener('change', () => {
    const selectedId = getSelectedPokemonId();
    // セレクトボックス変更時は一旦種族値表示に戻す
    displayChart(selectedId);
    displayTable(selectedId);
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
 * テーブルの表示
 * @param number ポケモンID
 */
function displayTable(id) {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    // 各行にデータを表示
    tableRows.forEach((row, index) => {
        row.children[1].textContent = pokemon.baseStatus[index];
        row.children[2].textContent = pokemon.effortValues[index];
        row.children[3].textContent = 
        `${calcActualValue(index, pokemon.baseStatus[index], pokemon.individualValues[index], pokemon.effortValues[index])} (${pokemon.individualValues[index]})`;
    });
}

/**
 * レーダーチャートのデータ生成
 * @param string label ラベル
 * @param array data ポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 * @param string color RGB(example: '255, 255, 255')
 * @return object レーダーチャート設定用データ
 */
function createChartData(label, data, color) {
    return {
        label: label,
        data: switchDataCS(data),  // CSを入れ替えたデータを利用
        fill: true,
        backgroundColor: `rgba(${color}, 0.2)`,
        borderColor: `rgb(${color})`,
        pointBackgroundColor: `rgb(${color})`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `rgb(${color})`
    };
}

/**
 * ポケモンのデータのCとSの値を入れ替えたデータを作成
 * @param array data ポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 * @return array CSを入れ替えたポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 */
function switchDataCS(data) {
    return [data[0], data[1], data[2], data[5], data[4], data[3]];
}

/**
 * 実数値を計算
 * @param number index インデックス番号(0:H、1:A...)
 * @param number baseStatus 種族値
 * @param number individualValue 個体値
 * @param number effortValue 努力値
 * @return number 実数値
 */
function calcActualValue(index, baseStatus, individualValue, effortValue) {
    // H実数値計算
    if (index === 0) {
        // H = (種族値 + 個体値 / 2 + 努力値 / 8) + 60
        return Math.trunc((baseStatus + (individualValue / 2) + (effortValue / 8)) + 60);
    }
    // ABCDS実数値計算
    const natureCorrection = 1;  // 性格補正
    // ABCDS = {(種族値 + 個体値 / 2 + 努力値 / 8) + 5} * 性格補正
    return Math.trunc((baseStatus + (individualValue / 2) + (effortValue / 8) + 5) * natureCorrection);
}