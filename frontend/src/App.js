import React, { useState, useEffect } from "react";

import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "./config";
import InputMask from "react-input-mask";

function App() {
  const [abaAtiva, setAbaAtiva] = useState("presenca");

  // Estados já existentes
  const [novaMatricula, setNovaMatricula] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [matricula, setMatricula] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [registros, setRegistros] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [modal, setModal] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "success" });

  // Novos estados para cadastro de aluno
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("");
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [alunos, setAlunos] = useState([]);

  useEffect(() => {
    carregarRegistrosDoMesAtual();
  }, []);

  useEffect(() => {
    if (abaAtiva === "cadastro") {
      axios
        .get(`${API_BASE_URL}/alunos`)
        .then((res) => setAlunos(res.data))
        .catch((err) => console.error("Erro ao buscar alunos:", err));
    }
  }, [abaAtiva]);

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

    // Verifica se matrícula existe entre os alunos cadastrados
    const alunoExiste = alunos.some(
      (a) => a.matricula === novaMatricula.trim()
    );
    if (!alunoExiste) {
      setAlert({
        message: "⚠️ Matrícula não encontrada. Cadastre o aluno primeiro.",
        type: "error",
      });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/registrar`, {
        matricula: novaMatricula.trim(),
      });
      setAlert({
        message: `✔ Presença registrada para ${novaMatricula}`,
        type: "success",
      });
      setNovaMatricula("");
      carregarRegistrosDoMesAtual();
    } catch {
      setAlert({ message: "❌ Erro ao registrar presença", type: "error" });
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

  const buscarAlunos = () => {
    axios
      .get(`${API_BASE_URL}/alunos`)
      .then((res) => setAlunos(res.data))
      .catch((err) => console.error("Erro ao buscar alunos:", err));
  };

  const cadastrarAluno = async () => {
    try {
      const aluno = {
        nome,
        telefone,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        pais,
      };

      // Validação mínima opcional
      if (!aluno.nome || aluno.nome.trim() === "") {
        setAlert({ message: "⚠️ Nome é obrigatório.", type: "error" });
        return;
      }

      const resposta = await axios.post(`${API_BASE_URL}/alunos`, aluno);

      if (resposta.status === 201 && resposta.data.id) {
        setAlert({
          message: "✅ Aluno cadastrado com sucesso!",
          type: "success",
        });
        // Limpar formulário
        setNome("");
        setTelefone("");
        setRua("");
        setNumero("");
        setBairro("");
        setCidade("");
        setEstado("");
        setPais("");

        // Atualizar lista
        buscarAlunos();
      } else {
        console.warn("Resposta inesperada:", resposta);

        setAlert({
          message: "⚠️ Ocorreu um problema ao cadastrar o aluno.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);

      setAlert({
        message: "❌ Erro ao cadastrar aluno. Tente novamente.",
        type: "error",
      });
    }
  };

  const toggleAlunoSelecionado = (id) => {
    setAlunosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const deletarAlunosSelecionados = async () => {
    if (alunosSelecionados.length === 0) return;
    try {
      for (const id of alunosSelecionados) {
        await axios.delete(`${API_BASE_URL}/alunos/${id}`);
      }
      setAlert({
        message: "✅ Alunos excluídos com sucesso!",
        type: "success",
      });
      setAlunosSelecionados([]);
      buscarAlunos();
    } catch (e) {
      console.error("Erro ao deletar alunos:", e);
      setAlert({ message: "❌ Erro ao deletar alunos.", type: "error" });
    }
  };

  function AlertMessage({ message, type, onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
      if (message) {
        setShow(true);
        const timer = setTimeout(() => setShow(false), 3500);
        const timer2 = setTimeout(onClose, 4500);
        return () => {
          clearTimeout(timer);
          clearTimeout(timer2);
        };
      }
    }, [message, onClose]);

    if (!message) return null;

    return (
      <div
        className={`transition-all duration-500 ${
          show ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${
          type === "success"
            ? "bg-emerald-100 border-emerald-400 text-emerald-800"
            : "bg-red-100 border-red-400 text-red-800"
        } border px-8 py-4 rounded-lg shadow-lg font-semibold text-lg`}
      >
        {message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="flex justify-center items-center mb-4">
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "" })}
        />
      </div>
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-6">
          Registro de chamada Carisma
        </h1>

        {/* Abas */}
        <div className="border-b border-slate-300 mb-8">
          <nav className="-mb-px flex space-x-6 justify-center">
            <button
              onClick={() => setAbaAtiva("presenca")}
              className={`px-4 py-2 border-b-2 font-medium ${
                abaAtiva === "presenca"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-sky-600 hover:border-sky-300"
              }`}
            >
              Registro de Presença
            </button>
            <button
              onClick={() => setAbaAtiva("cadastro")}
              className={`px-4 py-2 border-b-2 font-medium ${
                abaAtiva === "cadastro"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-sky-600 hover:border-sky-300"
              }`}
            >
              Cadastro de Aluno
            </button>
          </nav>
        </div>

        {/* Conteúdo da aba de Registro de presença */}
        {abaAtiva === "presenca" && (
          <>
            {/* Registrar presença */}
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
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  onClick={registrarPresenca}
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg"
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

            {/* Filtros */}
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
                  className="px-4 py-2 border rounded-lg border-slate-300"
                />
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="px-4 py-2 border rounded-lg border-slate-300"
                />
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="px-4 py-2 border rounded-lg border-slate-300"
                />
                <button
                  onClick={buscarFrequencia}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Buscar
                </button>
                <button
                  onClick={limparFiltros}
                  className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded-lg"
                >
                  Limpar
                </button>
              </div>
            </section>

            {/* Ações */}

            {/* Tabela */}
            <div className="overflow-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full min-w-[600px] table-auto text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">✓</th>
                    <th className="p-3">Matrícula</th>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-6 text-slate-500"
                      >
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    registros.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-slate-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selecionados.includes(item.id)}
                            onChange={() => toggleSelecionado(item.id)}
                          />
                        </td>

                        <td className="p-3">{item.matricula}</td>
                        <td className="p-3">
                          {new Date(item.data).toLocaleString("pt-BR")}
                        </td>
                        <td className="text-center p-3">
                          <button onClick={() => editarRegistro(item.id)}>
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 mt-4">
              <button
                onClick={exportarParaExcel}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                Exportar Excel
              </button>
              {selecionados.length > 0 && (
                <button
                  onClick={() => setModal("confirmarExclusao")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Deletar Selecionados
                </button>
              )}
            </div>
          </>
        )}

        {/* Conteúdo da aba de Cadastro de aluno */}
        {abaAtiva === "cadastro" && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">
              🧍 Cadastro de Aluno
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />
              <InputMask
                mask="(99) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    type="text"
                    placeholder="Telefone"
                    className="px-4 py-2 border border-slate-300 rounded-lg w-full"
                  />
                )}
              </InputMask>
              <input
                type="text"
                placeholder="Rua"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Número"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                maxLength={20}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />

              <input
                type="text"
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />

              <input
                type="text"
                placeholder="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="País"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                maxLength={254}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={cadastrarAluno}
                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg"
              >
                Cadastrar Aluno
              </button>
            </div>
            {mensagemAluno && (
              <div className="mt-2 text-center text-sm text-sky-700 font-medium">
                {mensagemAluno}
              </div>
            )}

            {/* Tabela de Alunos */}
            <div className="overflow-auto rounded-lg border border-slate-200 shadow-sm mb-6 mt-6">
              <table className="w-full min-w-[600px] table-auto text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">✓</th>
                    <th className="p-3">Matrícula</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3">Endereço</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-6 text-slate-500"
                      >
                        Nenhum aluno cadastrado.
                      </td>
                    </tr>
                  ) : (
                    alunos.map((aluno) => (
                      <tr
                        key={aluno.id}
                        className="border-t hover:bg-slate-50 transition"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={alunosSelecionados.includes(aluno.id)}
                            onChange={() => toggleAlunoSelecionado(aluno.id)}
                          />
                        </td>
                        <td className="p-3">{aluno.matricula}</td>
                        <td className="p-3">{aluno.nome}</td>
                        <td className="p-3">{aluno.telefone}</td>
                        <td className="p-3">
                          {aluno.rua}, {aluno.numero} - {aluno.bairro},{" "}
                          {aluno.cidade} - {aluno.estado}, {aluno.pais}
                        </td>
                        <td className="text-center p-3">
                          <button onClick={() => editarAluno(aluno.id)}>
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {alunosSelecionados.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setModal("confirmarExclusaoAluno")}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                >
                  Deletar {alunosSelecionados.length} aluno(s)
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal de confirmação de exclusão de registros */}
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
                onClick={async () => {
                  await deletarSelecionados();
                  setModal(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de alunos */}
      {modal === "confirmarExclusaoAluno" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-700 mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-slate-700 mb-6">
              Tem certeza que deseja excluir {alunosSelecionados.length}{" "}
              aluno(s)?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="bg-slate-300 text-slate-800 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deletarAlunosSelecionados();
                  setModal(null);
                }}
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
