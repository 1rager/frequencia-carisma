import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "./config";

function App() {
  const [matricula, setMatricula] = useState("");
  const [novaMatricula, setNovaMatricula] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [modal, setModal] = useState(null);

  const API = "https://frequencia-backend.up.railway.app";

  useEffect(() => {
    carregarRegistrosDoMesAtual();
  }, []);

  const carregarRegistrosDoMesAtual = async () => {
    const hoje = new Date();
    const inicioMes = `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const hojeStr = hoje.toISOString().split("T")[0];

    try {
      const res = await axios.get(`${API_BASE_URL}/frequencia`, {
        params: { dataInicial: inicioMes, dataFinal: hojeStr },
      });
      setRegistros(res.data);
    } catch (e) {
      console.error("Erro ao carregar registros:", e);
    }
  };

  const buscarFrequencia = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/frequencia`, {
        params: {
          matricula: matricula || undefined,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
      });
      setRegistros(res.data);
    } catch (e) {
      console.error("Erro ao buscar:", e);
    }
  };

  const limparFiltros = () => {
    setMatricula("");
    setDataInicial("");
    setDataFinal("");
    carregarRegistrosDoMesAtual();
  };

  const registrarPresenca = async () => {
    if (!novaMatricula.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/registrar`, {
        matricula: novaMatricula.trim(),
      });
      setMensagem(`✔ Presença registrada para ${novaMatricula}`);
      setNovaMatricula("");
      carregarRegistrosDoMesAtual();
      setTimeout(() => setMensagem(""), 3000);
    } catch {
      alert("Erro ao registrar presença");
    }
  };

  const exportarParaExcel = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/frequencia`, {
        params: {
          matricula: matricula || undefined,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
      });

      const worksheet = XLSX.utils.json_to_sheet(
        res.data.map((item) => ({
          ID: item.id,
          Matrícula: item.matricula,
          "Data/Hora": new Date(item.data).toLocaleString("pt-BR"),
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet, "Frequência");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "frequencia.xlsx");
    } catch {
      alert("Erro ao exportar");
    }
  };

  const toggleSelecionado = (id) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const deletarSelecionados = async () => {
    try {
      await axios.post(`${API_BASE_URL}/frequencia/delete`, {
        ids: selecionados,
      });
      setModal(null);
      setSelecionados([]);
      setModoSelecao(false);
      carregarRegistrosDoMesAtual();
    } catch {
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-6">
          Registro de chamada Carisma
        </h1>

        {/* Seção Registrar */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">
            📌 Registro de presença
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Digite a matrícula"
              value={novaMatricula}
              onChange={(e) => setNovaMatricula(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={registrarPresenca}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition whitespace-nowrap"
            >
              Registrar Presença
            </button>
          </div>
          {mensagem && (
            <div className="text-green-600 mt-3 text-center font-medium">
              {mensagem}
            </div>
          )}
        </section>

        {/* Seção Filtros */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">
            🔍 Buscar presença
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="col-span-1 sm:col-span-1 px-4 py-2 border rounded-lg border-slate-300"
            />
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="col-span-1 px-4 py-2 border rounded-lg border-slate-300"
            />
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="col-span-1 px-4 py-2 border rounded-lg border-slate-300"
            />
            <button
              onClick={buscarFrequencia}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Buscar
            </button>
            <button
              onClick={limparFiltros}
              className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition"
            >
              Limpar
            </button>
          </div>
        </section>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <button
            onClick={() => {
              setModoSelecao(!modoSelecao);
              setSelecionados([]);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            {modoSelecao ? "Cancelar Exclusão" : "Selecionar para Deletar"}
          </button>

          <button
            onClick={exportarParaExcel}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Exportar Excel
          </button>
        </div>

        {/* Tabela */}
        <div className="overflow-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full min-w-[600px] table-auto text-left">
            <thead className="bg-slate-100">
              <tr>
                {modoSelecao && <th className="p-3">✓</th>}
                <th className="p-3">ID</th>
                <th className="p-3">Matrícula</th>
                <th className="p-3">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                registros.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-slate-50 transition"
                  >
                    {modoSelecao && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(item.id)}
                          onChange={() => toggleSelecionado(item.id)}
                        />
                      </td>
                    )}
                    <td className="p-3">{item.id}</td>
                    <td className="p-3">{item.matricula}</td>
                    <td className="p-3">
                      {new Date(item.data).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {modoSelecao && selecionados.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setModal("confirmarExclusao")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Deletar Selecionados
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {modal === "confirmarExclusao" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-700 mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-slate-700 mb-6">
              Tem certeza que deseja excluir {selecionados.length} registro(s)?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="bg-slate-300 text-slate-800 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={deletarSelecionados}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
