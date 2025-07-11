import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./App.css";

function App() {
  const [matricula, setMatricula] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [registros, setRegistros] = useState([]);
  const [novaMatricula, setNovaMatricula] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [mostrarCheckbox, setMostrarCheckbox] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);

  const backendUrl = "http://localhost:3001"; // substitua pela URL real se necessário

  useEffect(() => {
    const buscarRegistrosDoMesAtual = async () => {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");

      try {
        const response = await axios.get(`${backendUrl}/frequencia`, {
          params: {
            dataInicial: `${ano}-${mes}-01`,
            dataFinal: `${ano}-${mes}-${dia}`,
          },
        });
        setRegistros(response.data);
      } catch (error) {
        console.error("Erro ao carregar registros:", error);
      }
    };

    buscarRegistrosDoMesAtual();
  }, []);

  const buscarFrequencia = async () => {
    try {
      const response = await axios.get(`${backendUrl}/frequencia`, {
        params: {
          matricula: matricula || undefined,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
      });
      setRegistros(response.data);
    } catch (error) {
      console.error("Erro ao buscar frequência:", error);
    }
  };

  const limparFiltros = async () => {
    setMatricula("");
    setDataInicial("");
    setDataFinal("");
    const response = await axios.get(`${backendUrl}/frequencia`);
    setRegistros(response.data);
  };

  const registrarPresenca = async () => {
    if (!novaMatricula) return alert("Digite uma matrícula válida");

    try {
      await axios.post(`${backendUrl}/registrar`, { matricula: novaMatricula });
      setMensagem(`✅ Presença registrada para ${novaMatricula}`);
      setNovaMatricula("");
      buscarFrequencia();
      setTimeout(() => setMensagem(""), 3000);
    } catch {
      alert("Erro ao registrar presença");
    }
  };

  const exportarParaExcel = async () => {
    try {
      const response = await axios.get(`${backendUrl}/frequencia`, {
        params: {
          matricula: matricula || undefined,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
      });

      if (response.data.length === 0) return alert("Nenhum dado encontrado.");

      const worksheet = XLSX.utils.json_to_sheet(
        response.data.map((item) => ({
          ID: item.id,
          Matrícula: item.matricula,
          "Data/Hora": new Date(item.data).toLocaleString("pt-BR"),
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Frequência");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "frequencia.xlsx");
      setMostrarModalExportar(false);
    } catch (error) {
      alert("Erro ao exportar");
      console.error(error);
    }
  };

  const alternarCheckbox = () => {
    setMostrarCheckbox(!mostrarCheckbox);
    setSelecionados([]);
  };

  const handleSelecionar = (id) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const deletarRegistros = async () => {
    try {
      await axios.post(`${backendUrl}/frequencia/delete`, {
        ids: selecionados,
      });
      setMostrarModalExcluir(false);
      setSelecionados([]);
      setMostrarCheckbox(false);
      buscarFrequencia();
    } catch (error) {
      alert("Erro ao deletar registros");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          📇 Sistema de Controle de Frequência NFC
        </h1>

        {/* REGISTRO */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Registrar presença</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Matrícula"
              value={novaMatricula}
              onChange={(e) => setNovaMatricula(e.target.value)}
              className="flex-1 border border-gray-300 px-4 py-2 rounded-md shadow-sm"
            />
            <button
              onClick={registrarPresenca}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 shadow-md"
            >
              Registrar
            </button>
          </div>
          {mensagem && (
            <p className="text-green-600 mt-3 animate-fade-in">{mensagem}</p>
          )}
        </div>

        {/* FILTROS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Filtrar presença</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="col-span-2 border border-gray-300 rounded-md px-4 py-2"
            />
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2"
            />
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2"
            />
            <button
              onClick={buscarFrequencia}
              className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Buscar
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={limparFiltros}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={alternarCheckbox}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            {mostrarCheckbox ? "Cancelar" : "Deletar Registros"}
          </button>
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto shadow-sm rounded-lg">
          <table className="w-full table-auto border-collapse bg-white">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                {mostrarCheckbox && <th className="px-4 py-3">✓</th>}
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Matrícula</th>
                <th className="px-4 py-3 text-left">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr
                    key={registro.id}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    {mostrarCheckbox && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(registro.id)}
                          onChange={() => handleSelecionar(registro.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">{registro.id}</td>
                    <td className="px-4 py-3">{registro.matricula}</td>
                    <td className="px-4 py-3">
                      {new Date(registro.data).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {mostrarCheckbox && selecionados.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setMostrarModalExcluir(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Deletar selecionados
            </button>
          </div>
        )}
      </div>

      {/* MODAL EXPORTAÇÃO */}
      {mostrarModalExportar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Exportar Excel
            </h2>
            <p>
              Confirme para exportar os dados atuais com os filtros aplicados.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setMostrarModalExportar(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={exportarParaExcel}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Exportar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {mostrarModalExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Confirmar exclusão
            </h2>
            <p>Tem certeza que deseja excluir os registros selecionados?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setMostrarModalExcluir(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={deletarRegistros}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Deletar agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
