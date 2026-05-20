const form = document.querySelector(".scheduler");
const invoiceList = document.querySelector("#invoiceList");
const invoiceTemplate = document.querySelector("#invoiceTemplate");
const addNotaButton = document.querySelector("#addNota");
const timeline = document.querySelector("#timeline");
const filterDate = document.querySelector("#filterDate");
const exportCsvButton = document.querySelector("#exportCsv");
const adminLoginButton = document.querySelector("#adminLogin");
const adminStatus = document.querySelector("#adminStatus");
const cancelEditButton = document.querySelector("#cancelEdit");
const linkExcelButton = document.querySelector("#linkExcel");
const saveExcelButton = document.querySelector("#saveExcel");
const lookupCnpjsButton = document.querySelector("#lookupCnpjs");
const monthGrid = document.querySelector("#monthGrid");
const monthLabel = document.querySelector("#monthLabel");
const prevMonthButton = document.querySelector("#prevMonth");
const nextMonthButton = document.querySelector("#nextMonth");
const chatToggle = document.querySelector("#chatToggle");
const chatPanel = document.querySelector("#chatPanel");
const chatClose = document.querySelector("#chatClose");
const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const distanciaReta = document.querySelector("#distanciaReta");
const distanciaRota = document.querySelector("#distanciaRota");
const tempoViagem = document.querySelector("#tempoViagem");
const kmFinal = document.querySelector("#kmFinal");
const dateLabel = document.querySelector("#dateLabel");
const vehicleDurationHint = document.querySelector("#vehicleDurationHint");
const gateHint = document.querySelector("#gateHint");
const totals = {
  agenda: document.querySelector("#totalAgenda"),
  hoje: document.querySelector("#totalHoje"),
  notas: document.querySelector("#totalNotas"),
};

const storageKey = "sandvik-agendamentos-v1";
const apiBase = "/api/schedules";
const excelHandleStore = "sandvik-excel-file-handle";
const adminSessionKey = "sandvik-admin-session";
const adminPin = "Sandvik";
const today = dateToISO(new Date());
const todayDate = new Date();
let calendarCursor = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
let currentInvoiceContext = {};
let editingScheduleId = null;
const gates = {
  production: "Portão 1 - Produção / ponte rolante",
  shipping: "Portão 2 - Expedição / carregamento",
  receiving: "Portão 3 - Descarga de material",
};
const sandvikAddress = "Sandvik - Rua Guglielmo Marconi, 240, Taubaté/SP";
const sandvikCoords = {
  lat: -23.02639,
  lng: -45.55528,
};

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const seed = [
  {
    id: crypto.randomUUID(),
    operacao: "Descarga",
    data: today,
    hora: "08:30",
    doca: gates.receiving,
    prioridade: "Programada",
    motorista: "Carlos Almeida",
    documento: "123.456.789-00",
    telefone: "(12) 99999-0182",
    transportadora: "Rota Vale Transportes",
    placa: "ABC1D23",
    carreta: "XYZ4E56",
    veiculo: "Carreta",
    peso: "18.000 kg",
    origem: "São Paulo - SP",
    destino: "Sandvik Taubaté - SP",
    origemLat: "-23.55052",
    origemLng: "-46.633308",
    destinoLat: "-23.02639",
    destinoLng: "-45.55528",
    kmReta: "118.6",
    kmEstimado: "148.2",
    kmFinal: "148.2",
    observacoes: "Material paletizado. Conferir EPI completo na portaria.",
    notas: [
      {
        numero: "458712",
        parceiro: "Fornecedor Metal Norte",
        volumes: "24",
        peso: "18.000 kg",
        cnpj: "",
        local: "",
        kmReta: "",
        kmEstimado: "",
        lat: "",
        lng: "",
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    operacao: "Expedicao",
    data: today,
    hora: "13:40",
    doca: gates.shipping,
    prioridade: "Critica",
    motorista: "Juliana Costa",
    documento: "987.654.321-00",
    telefone: "(11) 98888-4421",
    transportadora: "LogPro",
    placa: "DEF2G34",
    carreta: "",
    veiculo: "Truck",
    peso: "7.800 kg",
    origem: "Sandvik Taubaté - SP",
    destino: "São José dos Campos - SP",
    origemLat: "-23.02639",
    origemLng: "-45.55528",
    destinoLat: "-23.2237",
    destinoLng: "-45.9009",
    kmReta: "41.7",
    kmEstimado: "52.1",
    kmFinal: "52.1",
    observacoes: "Carga destinada ao cliente final. Separação liberada pelo PCP.",
    notas: [
      {
        numero: "778901",
        parceiro: "Cliente Mineracao Serra",
        volumes: "12",
        peso: "7.800 kg",
        cnpj: "",
        local: "",
        kmReta: "",
        kmEstimado: "",
        lat: "",
        lng: "",
      },
    ],
  },
];

let schedules = [];

async function loadSchedules() {
  try {
    const response = await fetch(apiBase);
    if (!response.ok) throw new Error("API indisponível");
    const loaded = migrateSchedules(await response.json());
    localStorage.setItem(storageKey, JSON.stringify(loaded));
    return loaded;
  } catch (error) {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    return migrateSchedules(JSON.parse(saved));
  }
}

async function refreshSchedules() {
  schedules = await loadSchedules();
  render();
}

function createAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function migrateSchedules(items) {
  return items.map((item) => ({
    ...item,
    accessCode: item.accessCode || createAccessCode(),
    prioridade: item.prioridade === "Critica" ? "Crítica" : item.prioridade,
    veiculo:
      item.veiculo === "Utilitario pequeno"
        ? "Utilitário pequeno"
        : item.veiculo === "Utilitario medio / van"
          ? "Utilitário médio / van"
          : item.veiculo === "Caminhao 3/4"
            ? "Caminhão 3/4"
            : item.veiculo,
    doca:
      item.doca === "Doca 03 - Expedicao"
        ? gates.shipping
        : item.doca === "Doca 02 - Recebimento"
          ? gates.receiving
          : item.doca === "Doca 01 - Recebimento"
            ? gates.receiving
            : item.doca === "Doca 02 - Expedicao"
              ? gates.shipping
              : item.doca === "Doca 03 - Recebimento"
                ? gates.receiving
                : item.doca,
    duracaoMin: scheduleDuration({ ...item, duracaoMin: null }),
  }));
}

function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function calculateDistanceKm(originLat, originLng, targetLat, targetLng) {
  const radius = 6371;
  const dLat = toRad(targetLat - originLat);
  const dLng = toRad(targetLng - originLng);
  const lat1 = toRad(originLat);
  const lat2 = toRad(targetLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

function parseCoordinate(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isNaN(parsed) ? NaN : parsed;
}

function currentDistance() {
  const data = new FormData(form);
  const originLat = parseCoordinate(data.get("origemLat"));
  const originLng = parseCoordinate(data.get("origemLng"));
  const targetLat = parseCoordinate(data.get("destinoLat"));
  const targetLng = parseCoordinate(data.get("destinoLng"));

  if ([originLat, originLng, targetLat, targetLng].some((value) => Number.isNaN(value))) {
    return null;
  }

  const kmReta = calculateDistanceKm(originLat, originLng, targetLat, targetLng);
  const kmEstimado = kmReta * 1.25;
  return {
    kmReta: kmReta.toFixed(1),
    kmEstimado: kmEstimado.toFixed(1),
  };
}

function vehicleAverageSpeed(vehicle) {
  const normalized = (vehicle || "").toLowerCase();
  if (normalized.includes("passeio")) return 75;
  if (normalized.includes("pequeno")) return 70;
  if (normalized.includes("medio") || normalized.includes("médio") || normalized.includes("van")) return 65;
  if (normalized.includes("3/4")) return 60;
  if (normalized.includes("truck") || normalized.includes("trucado")) return 55;
  if (normalized.includes("carreta")) return 50;
  if (normalized.includes("prancha")) return 40;
  return 55;
}

function formatTravelTime(km, vehicle) {
  const distance = Number(String(km || "").replace(",", "."));
  if (!distance) return "0 h";
  const normalized = (vehicle || "").toLowerCase();
  const rawMinutes = Math.round((distance / vehicleAverageSpeed(vehicle)) * 60);
  const minutes = normalized.includes("prancha") ? daylightTravelMinutes(rawMinutes) : rawMinutes;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (normalized.includes("prancha")) {
    const days = Math.floor(hours / 24);
    const dayHours = hours % 24;
    if (days && dayHours) return `${days} dia${days > 1 ? "s" : ""} e ${dayHours}h${String(rest).padStart(2, "0")}`;
    if (days) return `${days} dia${days > 1 ? "s" : ""}`;
  }
  if (!hours) return `${rest} min`;
  return `${hours}h${String(rest).padStart(2, "0")}`;
}

function daylightTravelMinutes(drivingMinutes) {
  const daylightWindowMinutes = 12 * 60;
  if (drivingMinutes <= daylightWindowMinutes) return drivingMinutes;
  const fullDays = Math.floor(drivingMinutes / daylightWindowMinutes);
  const remaining = drivingMinutes % daylightWindowMinutes;
  return fullDays * 24 * 60 + remaining;
}

function updateDistancePreview(fillFinal = false) {
  const distance = currentDistance();
  if (!distance) {
    distanciaReta.textContent = "0 km";
    distanciaRota.textContent = "0 km";
    tempoViagem.textContent = "0 h";
    return;
  }

  distanciaReta.textContent = `${distance.kmReta} km`;
  distanciaRota.textContent = `${distance.kmEstimado} km`;
  tempoViagem.textContent = formatTravelTime(kmFinal.value || distance.kmEstimado, form.querySelector('[name="veiculo"]').value);
  if (fillFinal && !kmFinal.value) kmFinal.value = distance.kmEstimado;
}

function updateDateLabel() {
  const operation = form.querySelector('[name="operacao"]:checked').value;
  dateLabel.textContent = operation === "Expedicao" ? "Data da coleta" : "Data da entrega";
}

function updateVehicleDurationHint() {
  const formData = new FormData(form);
  const operation = formData.get("operacao");
  const vehicle = formData.get("veiculo");
  const weight = formData.get("peso");
  const duration = scheduleDuration({ operacao: operation, veiculo: vehicle, peso: weight, duracaoMin: null });
  const rule = scheduleRuleLabel({ operacao: operation, veiculo: vehicle, peso: weight });
  vehicleDurationHint.textContent = vehicle
    ? `${duration} minutos reservados na agenda${rule ? ` - ${rule}` : ""}`
    : "Selecione para ver o tempo reservado";
  updateDistancePreview();
}

function updateGateHint(shouldAutoSelect = false) {
  const data = new FormData(form);
  const candidate = {
    operacao: data.get("operacao"),
    veiculo: data.get("veiculo"),
    peso: data.get("peso"),
  };
  const gate = recommendedGate(candidate);
  gateHint.textContent = `${gate}. ${gateReason(candidate)}`;
  const gateSelect = form.querySelector('[name="doca"]');
  if (shouldAutoSelect || !gateSelect.value) gateSelect.value = gate;
}

async function saveSchedules() {
  localStorage.setItem(storageKey, JSON.stringify(schedules));
  const response = await fetch(`${apiBase}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: schedules }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Não foi possível salvar no banco central.");
  }
}

async function saveScheduleRemote(schedule) {
  const response = await fetch(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Não foi possível salvar no banco central.");
  }
  return response.json();
}

async function deleteScheduleRemote(id) {
  const response = await fetch(`${apiBase}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Não foi possível excluir no banco central.");
  }
}

function parseWeightKg(value) {
  const text = String(value || "").toLowerCase();
  const hasTon = text.includes("ton") || text.includes("t");
  let numeric = text.replace(/[^\d,.-]/g, "");
  if (!numeric) return 0;
  if (numeric.includes(",") && numeric.includes(".")) {
    numeric = numeric.replace(/\./g, "").replace(",", ".");
  } else if (numeric.includes(",")) {
    numeric = numeric.replace(",", ".");
  } else if (numeric.includes(".")) {
    const parts = numeric.split(".");
    if (parts.at(-1)?.length === 3) numeric = parts.join("");
  }
  const weight = Number(numeric);
  if (Number.isNaN(weight)) return 0;
  return hasTon && weight < 1000 ? weight * 1000 : weight;
}

function isHeavyUnload(item) {
  return item.operacao === "Descarga" && parseWeightKg(item.peso) > 2500;
}

function isHeavyDeckLoad(item) {
  const vehicle = (item.veiculo || "").toLowerCase();
  return item.operacao === "Expedicao" && vehicle.includes("prancha") && parseWeightKg(item.peso) >= 10000;
}

function vehicleDuration(vehicle) {
  const normalized = (vehicle || "").toLowerCase();
  if (normalized.includes("passeio")) return 15;
  if (normalized.includes("pequeno")) return 20;
  if (normalized.includes("medio") || normalized.includes("médio") || normalized.includes("van")) return 30;
  if (normalized.includes("3/4") || normalized.includes("truck") || normalized.includes("trucado")) return 40;
  if (normalized.includes("carreta") || normalized.includes("prancha")) return 60;
  return 40;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function workingWindows(item) {
  if (item.operacao === "Expedicao" || item.doca === gates.shipping) {
    return [
      { start: 8 * 60, end: 12 * 60 },
      { start: 13 * 60 + 30, end: 17 * 60 },
    ];
  }
  return [
    { start: 8 * 60, end: 11 * 60 + 30 },
    { start: 13 * 60 + 30, end: 16 * 60 },
  ];
}

function workingHoursLabel(item) {
  return item.operacao === "Expedicao" || item.doca === gates.shipping
    ? "Expedição: 08:00 às 12:00 e 13:30 às 17:00"
    : "Recebimento: 08:00 às 11:30 e 13:30 às 16:00";
}

function scheduleWithinWorkingHours(item) {
  const start = timeToMinutes(item.hora);
  const end = start + scheduleDuration(item);
  return workingWindows(item).some((window) => start >= window.start && end <= window.end);
}

function nextWorkingStart(item, fromMinutes = timeToMinutes(item.hora)) {
  const duration = scheduleDuration(item);
  for (const window of workingWindows(item)) {
    const start = Math.max(fromMinutes, window.start);
    if (start + duration <= window.end) return start;
  }
  return null;
}

function scheduleDuration(item) {
  if (isHeavyDeckLoad(item)) return 240;
  if (isHeavyUnload(item)) return 90;
  return Number(item.duracaoMin) || vehicleDuration(item.veiculo);
}

function scheduleRuleLabel(item) {
  if (isHeavyDeckLoad(item)) return "prancha/peneiras acima de 10 t";
  if (isHeavyUnload(item)) return "ponte rolante, descarga sem etiquetagem";
  return "";
}

function recommendedGate(item) {
  if (item.operacao === "Expedicao") return gates.shipping;
  if (isHeavyUnload(item)) return gates.production;
  return gates.receiving;
}

function gateReason(item) {
  if (item.operacao === "Expedicao") return "Expedição usa apenas o Portão 2 para carregamento.";
  if (isHeavyUnload(item)) return "Peso acima da empilhadeira de 2,5 t: descarregar no Portão 1 com ponte rolante.";
  return "Descarga comum de material deve usar o Portão 3.";
}

function scheduleEndTime(item) {
  return minutesToTime(timeToMinutes(item.hora) + scheduleDuration(item));
}

function hasDockConflict(candidate) {
  const start = timeToMinutes(candidate.hora);
  const end = start + scheduleDuration(candidate);
  return schedules.some((item) => {
    if (item.id === candidate.id || item.data !== candidate.data || item.doca !== candidate.doca) {
      return false;
    }
    const itemStart = timeToMinutes(item.hora);
    const itemEnd = itemStart + scheduleDuration(item);
    return start < itemEnd && end > itemStart;
  });
}

function findDockConflict(candidate) {
  const start = timeToMinutes(candidate.hora);
  const end = start + scheduleDuration(candidate);
  return schedules.find((item) => {
    if (item.id === candidate.id || item.data !== candidate.data || item.doca !== candidate.doca) {
      return false;
    }
    const itemStart = timeToMinutes(item.hora);
    const itemEnd = itemStart + scheduleDuration(item);
    return start < itemEnd && end > itemStart;
  });
}

function nextAvailableSlot(candidate) {
  const duration = scheduleDuration(candidate);
  let start = nextWorkingStart(candidate);
  if (start === null) return null;
  const sameDockItems = schedules
    .filter((item) => item.data === candidate.data && item.doca === candidate.doca && item.id !== candidate.id)
    .sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

  while (start !== null) {
    const conflict = sameDockItems.find((item) => {
      const itemStart = timeToMinutes(item.hora);
      const itemEnd = itemStart + scheduleDuration(item);
      return start < itemEnd && start + duration > itemStart;
    });
    if (!conflict) {
      return {
        start: minutesToTime(start),
        end: minutesToTime(start + duration),
      };
    }
    start = nextWorkingStart(candidate, timeToMinutes(conflict.hora) + scheduleDuration(conflict));
  }
  return null;
}

function parseDateFromText(text) {
  const explicit = text.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (explicit) {
    const day = explicit[1].padStart(2, "0");
    const month = explicit[2].padStart(2, "0");
    const year = explicit[3]
      ? explicit[3].length === 2
        ? `20${explicit[3]}`
        : explicit[3]
      : String(new Date().getFullYear());
    return `${year}-${month}-${day}`;
  }
  if (text.includes("hoje")) return today;
  if (text.includes("amanha") || text.includes("amanhã")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateToISO(tomorrow);
  }
  return null;
}

function parseTimeFromText(text) {
  const match = text.match(/(\d{1,2})(?:[:h](\d{2}))?/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || "00");
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseGateFromText(text) {
  if (text.includes("portao 1") || text.includes("portão 1")) return gates.production;
  if (text.includes("portao 2") || text.includes("portão 2")) return gates.shipping;
  if (text.includes("portao 3") || text.includes("portão 3")) return gates.receiving;
  if (text.includes("expedicao") || text.includes("expedição") || text.includes("coleta")) return gates.shipping;
  if (text.includes("ponte")) return gates.production;
  if (text.includes("descarga")) return gates.receiving;
  return null;
}

function parseVehicleFromText(text) {
  if (text.includes("passeio")) return "Carro de passeio";
  if (text.includes("pequeno") || text.includes("utilitario pequeno") || text.includes("utilitário pequeno")) {
    return "Utilitário pequeno";
  }
  if (text.includes("van") || text.includes("medio") || text.includes("médio")) return "Utilitário médio / van";
  if (text.includes("3/4")) return "Caminhão 3/4";
  if (text.includes("truck") || text.includes("trucado")) return "Truck / trucado";
  if (text.includes("carreta")) return "Carreta";
  if (text.includes("prancha")) return "Prancha";
  return "Truck / trucado";
}

function availabilityReply(question) {
  const text = question.toLowerCase();
  if (!/(livre|disponivel|disponível|horario|horário|agenda|agendar|encaixe)/.test(text)) return null;

  const date = parseDateFromText(text);
  const time = parseTimeFromText(text);
  const gate = parseGateFromText(text);
  const vehicle = parseVehicleFromText(text);
  const operation = gate === gates.shipping || text.includes("coleta") || text.includes("carregamento") ? "Expedicao" : "Descarga";

  if (!date || !time || !gate) {
    return "Consigo verificar disponibilidade. Informe data, horário, portão e tipo de veículo. Exemplo: tem horário dia 20/05 às 09:00 no portão 3 para truck?";
  }

  const candidate = {
    id: "chat-check",
    data: date,
    hora: time,
    doca: gate,
    veiculo: vehicle,
    operacao: operation,
    peso: "",
    duracaoMin: null,
  };
  const duration = scheduleDuration(candidate);
  if (!scheduleWithinWorkingHours(candidate)) {
    const suggestion = nextAvailableSlot(candidate);
    return suggestion
      ? `Esse horário está fora da jornada ou termina fora da janela de atendimento. ${workingHoursLabel(candidate)}. Próximo horário livre sugerido: ${suggestion.start} às ${suggestion.end}.`
      : `Esse horário está fora da jornada de atendimento. ${workingHoursLabel(candidate)}. Não encontrei outro encaixe livre nesse mesmo dia.`;
  }

  const conflict = findDockConflict(candidate);
  const endTime = minutesToTime(timeToMinutes(time) + duration);

  if (!conflict) {
    return `Horário livre: ${date} das ${time} às ${endTime} no ${gate}, considerando ${duration} minutos para ${vehicle}.`;
  }

  const suggestion = nextAvailableSlot(candidate);
  const suggestionText = suggestion
    ? ` Próximo horário livre sugerido: ${suggestion.start} às ${suggestion.end}.`
    : " Não encontrei outro encaixe livre dentro da jornada desse mesmo dia.";
  return `Horário indisponível no ${gate}. Já existe ${conflict.operacao} das ${conflict.hora} às ${scheduleEndTime(conflict)} para ${conflict.transportadora || "transportadora cadastrada"} (${conflict.veiculo}).${suggestionText}`;
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function helpSummary() {
  return [
    "Posso ajudar com: verificar horário livre, escolher portão, explicar tipo de veículo, preencher CNPJ, cadastrar NF, exportação, distância, Excel, EPI obrigatório, contatos e horário de atendimento.",
    "Exemplos: tem horário dia 20/05 às 09:00 no portão 3 para truck? | como cadastro cliente de exportação? | qual portão para ponte rolante?",
  ].join("<br><br>");
}

function addInvoiceRow(data = {}) {
  const row = invoiceTemplate.content.firstElementChild.cloneNode(true);
  const context = { ...currentInvoiceContext, ...data };
  row.querySelector('[name="notaDestinoTipo"]').value = context.destinoTipo || "brasil";
  row.querySelector('[name="notaNumero"]').value = data.numero || "";
  row.querySelector('[name="notaCnpj"]').value = context.cnpj || "";
  row.querySelector('[name="notaParceiro"]').value = context.parceiro || "";
  row.querySelector('[name="notaCidadeExportacao"]').value = context.cidadeExportacao || "";
  row.querySelector('[name="notaPaisExportacao"]').value = context.paisExportacao || "";
  row.querySelector('[name="notaVolumes"]').value = data.volumes || "";
  row.querySelector('[name="notaPeso"]').value = data.peso || "";
  row.querySelector('[name="notaLocal"]').value = context.local || "";
  row.querySelector('[name="notaKmReta"]').value = context.kmReta ? `${context.kmReta} km` : "";
  row.querySelector('[name="notaKmEstimado"]').value = context.kmEstimado ? `${context.kmEstimado} km` : "";
  row.querySelector('[name="notaLat"]').value = context.lat || "";
  row.querySelector('[name="notaLng"]').value = context.lng || "";
  row.querySelector(".lookup-note").addEventListener("click", () => lookupLotDestination(row));
  row.querySelector('[name="notaCnpj"]').addEventListener("input", () => autoLookupSupplier(row));
  row.querySelector('[name="notaDestinoTipo"]').addEventListener("change", () => {
    updateLotDestinationMode(row);
    updateInvoiceContextFromRow(row);
  });
  row.querySelector('[name="notaCidadeExportacao"]').addEventListener("input", () => autoLookupExportDestination(row));
  row.querySelector('[name="notaPaisExportacao"]').addEventListener("input", () => autoLookupExportDestination(row));
  ["notaCnpj", "notaParceiro", "notaCidadeExportacao", "notaPaisExportacao", "notaLocal"].forEach((name) => {
    row.querySelector(`[name="${name}"]`).addEventListener("input", () => updateInvoiceContextFromRow(row));
  });
  row.querySelector(".remove-note").addEventListener("click", () => {
    if (invoiceList.children.length > 1) row.remove();
  });
  updateLotDestinationMode(row);
  invoiceList.append(row);
}

function invoiceContextFromRow(row) {
  return {
    destinoTipo: row.querySelector('[name="notaDestinoTipo"]').value,
    cnpj: row.querySelector('[name="notaCnpj"]').value.trim(),
    parceiro: row.querySelector('[name="notaParceiro"]').value.trim(),
    cidadeExportacao: row.querySelector('[name="notaCidadeExportacao"]').value.trim(),
    paisExportacao: row.querySelector('[name="notaPaisExportacao"]').value.trim(),
    local: row.querySelector('[name="notaLocal"]').value.trim(),
    kmReta: row.querySelector('[name="notaKmReta"]').value.replace(" km", "").trim(),
    kmEstimado: row.querySelector('[name="notaKmEstimado"]').value.replace(" km", "").trim(),
    lat: row.querySelector('[name="notaLat"]').value.trim(),
    lng: row.querySelector('[name="notaLng"]').value.trim(),
  };
}

function updateInvoiceContextFromRow(row) {
  currentInvoiceContext = invoiceContextFromRow(row);
}

function collectInvoices() {
  return [...invoiceList.querySelectorAll(".invoice-row")].map((row) => ({
    numero: row.querySelector('[name="notaNumero"]').value.trim(),
    destinoTipo: row.querySelector('[name="notaDestinoTipo"]').value,
    cnpj: row.querySelector('[name="notaCnpj"]').value.trim(),
    parceiro: row.querySelector('[name="notaParceiro"]').value.trim(),
    cidadeExportacao: row.querySelector('[name="notaCidadeExportacao"]').value.trim(),
    paisExportacao: row.querySelector('[name="notaPaisExportacao"]').value.trim(),
    volumes: row.querySelector('[name="notaVolumes"]').value.trim(),
    peso: row.querySelector('[name="notaPeso"]').value.trim(),
    local: row.querySelector('[name="notaLocal"]').value.trim(),
    kmReta: row.querySelector('[name="notaKmReta"]').value.replace(" km", "").trim(),
    kmEstimado: row.querySelector('[name="notaKmEstimado"]').value.replace(" km", "").trim(),
    lat: row.querySelector('[name="notaLat"]').value.trim(),
    lng: row.querySelector('[name="notaLng"]').value.trim(),
  }));
}

function splitInvoiceNumbers(value) {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function countInvoiceNumbers(items) {
  return items.reduce((total, item) => total + splitInvoiceNumbers(item.numero || "").length, 0);
}

function operationCalendarLabel(operation) {
  return operation === "Expedicao" ? "Coleta" : "Entrega";
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function getDestinationCoords() {
  return sandvikCoords;
}

function syncSandvikDestination() {
  const operation = form.querySelector('[name="operacao"]:checked')?.value || "Descarga";
  if (operation === "Descarga") {
    if (form.querySelector('[name="origem"]').value === sandvikAddress) {
      form.querySelector('[name="origem"]').value = "";
      form.querySelector('[name="origemLat"]').value = "";
      form.querySelector('[name="origemLng"]').value = "";
    }
    form.querySelector('[name="destino"]').value = sandvikAddress;
    form.querySelector('[name="destinoLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="destinoLng"]').value = sandvikCoords.lng;
  } else {
    form.querySelector('[name="origem"]').value = sandvikAddress;
    form.querySelector('[name="origemLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="origemLng"]').value = sandvikCoords.lng;
    if (form.querySelector('[name="destino"]').value === sandvikAddress) {
      form.querySelector('[name="destino"]').value = "";
      form.querySelector('[name="destinoLat"]').value = "";
      form.querySelector('[name="destinoLng"]').value = "";
    }
  }
}

function setTripTextFromNote(label) {
  const operation = form.querySelector('[name="operacao"]:checked')?.value || "Descarga";
  if (operation === "Descarga") {
    form.querySelector('[name="origem"]').value = label;
    form.querySelector('[name="origemLat"]').value = "";
    form.querySelector('[name="origemLng"]').value = "";
    form.querySelector('[name="destino"]').value = sandvikAddress;
    form.querySelector('[name="destinoLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="destinoLng"]').value = sandvikCoords.lng;
  } else {
    form.querySelector('[name="origem"]').value = sandvikAddress;
    form.querySelector('[name="origemLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="origemLng"]').value = sandvikCoords.lng;
    form.querySelector('[name="destino"]').value = label;
    form.querySelector('[name="destinoLat"]').value = "";
    form.querySelector('[name="destinoLng"]').value = "";
  }
  updateDistancePreview();
}

function setTripLocationFromNote(row, lat, lng, label) {
  const operation = form.querySelector('[name="operacao"]:checked')?.value || "Descarga";
  if (operation === "Descarga") {
    form.querySelector('[name="origem"]').value = label;
    form.querySelector('[name="origemLat"]').value = lat;
    form.querySelector('[name="origemLng"]').value = lng;
    form.querySelector('[name="destino"]').value = sandvikAddress;
    form.querySelector('[name="destinoLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="destinoLng"]').value = sandvikCoords.lng;
  } else {
    form.querySelector('[name="origem"]').value = sandvikAddress;
    form.querySelector('[name="origemLat"]').value = sandvikCoords.lat;
    form.querySelector('[name="origemLng"]').value = sandvikCoords.lng;
    form.querySelector('[name="destino"]').value = label;
    form.querySelector('[name="destinoLat"]').value = lat;
    form.querySelector('[name="destinoLng"]').value = lng;
  }
  updateDistancePreview(true);
  recalculateInvoiceDistances();
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(^|\s|-)([a-z\u00c0-\u00ff])/g, (match, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

function uppercasePlate(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidMobile(value) {
  const digits = digitsOnly(value);
  return digits.length === 11;
}

function whatsappNumber(value) {
  const digits = digitsOnly(value);
  if (digits.length !== 11) return "";
  return `55${digits}`;
}

function dateToBR(value) {
  const [year, month, day] = String(value || "").split("-");
  if (!year || !month || !day) return value || "";
  return `${day}/${month}/${year}`;
}

function reminderMessage(item) {
  const operation = item.operacao === "Expedicao" ? "coleta" : "entrega";
  return [
    `Olá, ${item.motorista}.`,
    `Lembrete de agendamento Sandvik Taubaté: sua ${operation} está programada para ${dateToBR(item.data)} às ${item.hora}, no ${item.doca}.`,
    "A tolerância máxima de atraso é de 5 minutos. Caso ultrapasse esse limite, será necessário reagendar a coleta/entrega.",
    `Código para ajustar o agendamento: ${item.accessCode}.`,
    "Para adentrar na empresa, é obrigatório usar capacete, óculos de segurança, calçado de segurança e protetor auricular.",
  ].join("\n\n");
}

function openReminderWhatsApp(item) {
  const number = whatsappNumber(item.telefone);
  if (!number) {
    alert("Informe um celular válido do motorista com DDD para enviar o lembrete por WhatsApp.");
    return;
  }
  const url = `https://wa.me/${number}?text=${encodeURIComponent(reminderMessage(item))}`;
  window.open(url, "_blank", "noopener");
}

function formatCpf(value) {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatCnpj(value) {
  const digits = digitsOnly(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

function applyTextFormatting(input) {
  if (!input || input.selectionStart === null) return;
  const cursor = input.selectionStart;
  const titleFields = ["motorista", "transportadora", "origem", "notaParceiro", "notaCidadeExportacao", "notaPaisExportacao"];
  const plateFields = ["placa", "carreta"];
  const original = input.value;
  if (titleFields.includes(input.name)) {
    input.value = titleCase(original);
  }
  if (plateFields.includes(input.name)) {
    input.value = uppercasePlate(original);
  }
  if (input.name === "telefone") {
    input.value = formatPhone(original);
  }
  if (input.name === "documento") {
    input.value = formatCpf(original);
  }
  if (input.name === "notaCnpj") {
    input.value = formatCnpj(original);
  }
  const offset = input.value.length - original.length;
  input.setSelectionRange(Math.max(0, cursor + offset), Math.max(0, cursor + offset));
}

function formatAllTextFields() {
  ["motorista", "transportadora", "origem", "notaParceiro", "notaCidadeExportacao", "notaPaisExportacao", "placa", "carreta", "telefone", "documento", "notaCnpj"].forEach((name) => {
    form.querySelectorAll(`[name="${name}"]`).forEach((input) => applyTextFormatting(input));
  });
}

async function getRoadDistanceKm(originLat, originLng, targetLat, targetLng) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${targetLng},${targetLat}` +
    "?overview=false";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Rota indisponivel");
  const data = await response.json();
  const distanceMeters = data.routes?.[0]?.distance;
  if (!distanceMeters) throw new Error("Rota sem distância");
  return distanceMeters / 1000;
}

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Endereço sem geolocalização");
  const data = await response.json();
  if (!data.length) throw new Error("Endereço sem coordenadas");
  return {
    latitude: data[0].lat,
    longitude: data[0].lon,
  };
}

async function setRowDistance(row, originLat, originLng) {
  const destination = getDestinationCoords();
  if (!destination) return;

  const kmReta = calculateDistanceKm(Number(originLat), Number(originLng), destination.lat, destination.lng);
  let kmRodoviario = kmReta * 1.25;
  try {
    kmRodoviario = await getRoadDistanceKm(originLat, originLng, destination.lat, destination.lng);
  } catch {
    // Mantem uma estimativa quando o servico publico de rota nao responder.
  }
  row.querySelector('[name="notaKmReta"]').value = `${kmReta.toFixed(1)} km`;
  row.querySelector('[name="notaKmEstimado"]').value = `${kmRodoviario.toFixed(1)} km`;
}

async function lookupSupplier(row) {
  const cnpj = digitsOnly(row.querySelector('[name="notaCnpj"]').value);
  const localInput = row.querySelector('[name="notaLocal"]');
  if (cnpj.length !== 14) {
    localInput.value = "CNPJ inválido";
    return;
  }

  localInput.value = "Consultando CNPJ...";
  try {
    const companyResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!companyResponse.ok) throw new Error("CNPJ não encontrado");
    const company = await companyResponse.json();
    const cep = onlyDigits(company.cep || "");
    const address = [company.logradouro, company.numero, company.bairro, company.municipio, company.uf]
      .filter(Boolean)
      .join(", ");
    const formattedCnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    const companyName = company.nome_fantasia || company.razao_social || "";

    row.querySelector('[name="notaParceiro"]').value =
      companyName || row.querySelector('[name="notaParceiro"]').value;
    row.querySelector('[name="notaCnpj"]').value = formattedCnpj;
    localInput.value = [
      companyName ? `${companyName} - CNPJ ${formattedCnpj}` : `CNPJ ${formattedCnpj}`,
      address || "Endereço encontrado sem detalhes",
      cep ? `CEP ${cep}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    setTripTextFromNote(address || companyName || formattedCnpj);

    let coords = null;
    if (cep) {
      try {
        const cepResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
        if (cepResponse.ok) {
          const cepData = await cepResponse.json();
          coords = cepData.location?.coordinates || null;
        }
      } catch {
        coords = null;
      }
    }

    if (!coords?.latitude || !coords?.longitude) {
      try {
        coords = await geocodeAddress(`${address}, Brasil`);
      } catch {
        coords = await geocodeAddress(`${company.municipio || ""}, ${company.uf || ""}, Brasil`);
      }
    }

    row.querySelector('[name="notaLat"]').value = coords.latitude;
    row.querySelector('[name="notaLng"]').value = coords.longitude;
    await setRowDistance(row, coords.latitude, coords.longitude);
    setTripLocationFromNote(row, coords.latitude, coords.longitude, address || companyName || formattedCnpj);
    updateInvoiceContextFromRow(row);
  } catch (error) {
    localInput.value = `${localInput.value} - ${error.message}`;
  }
}

function updateLotDestinationMode(row) {
  const isExport = row.querySelector('[name="notaDestinoTipo"]').value === "exportacao";
  row.querySelectorAll('[data-mode="brasil"]').forEach((element) => {
    element.hidden = isExport;
  });
  row.querySelectorAll('[data-mode="exportacao"]').forEach((element) => {
    element.hidden = !isExport;
  });
  row.querySelector(".lookup-note").textContent = isExport ? "Buscar cidade" : "Buscar CNPJ";
  row.querySelector('[name="notaLocal"]').placeholder = isExport
    ? "Busca automática por cidade e país"
    : "Busca automática pelo CNPJ";
}

async function lookupExportDestination(row) {
  const city = row.querySelector('[name="notaCidadeExportacao"]').value.trim();
  const country = row.querySelector('[name="notaPaisExportacao"]').value.trim();
  const localInput = row.querySelector('[name="notaLocal"]');
  if (!city || !country) {
    localInput.value = "Informe cidade e país da exportação";
    return;
  }

  localInput.value = "Consultando cidade e país...";
  try {
    const coords = await geocodeAddress(`${city}, ${country}`);
    row.querySelector('[name="notaLat"]').value = coords.latitude;
    row.querySelector('[name="notaLng"]').value = coords.longitude;
    localInput.value = `Exportação para ${city}, ${country}`;
    await setRowDistance(row, coords.latitude, coords.longitude);
    setTripLocationFromNote(row, coords.latitude, coords.longitude, `${city}, ${country}`);
    updateInvoiceContextFromRow(row);
  } catch (error) {
    localInput.value = `Exportação para ${city}, ${country} - ${error.message}`;
  }
}

async function lookupLotDestination(row) {
  if (row.querySelector('[name="notaDestinoTipo"]').value === "exportacao") {
    await lookupExportDestination(row);
    return;
  }
  await lookupSupplier(row);
}

function autoLookupSupplier(row) {
  if (row.querySelector('[name="notaDestinoTipo"]').value !== "brasil") return;
  const input = row.querySelector('[name="notaCnpj"]');
  const cnpj = digitsOnly(input.value);
  clearTimeout(row.lookupTimer);
  if (cnpj.length !== 14 || input.dataset.lastLookup === cnpj) return;
  row.lookupTimer = setTimeout(async () => {
    input.dataset.lastLookup = cnpj;
    await lookupSupplier(row);
  }, 550);
}

function autoLookupExportDestination(row) {
  if (row.querySelector('[name="notaDestinoTipo"]').value !== "exportacao") return;
  const city = row.querySelector('[name="notaCidadeExportacao"]').value.trim();
  const country = row.querySelector('[name="notaPaisExportacao"]').value.trim();
  clearTimeout(row.exportLookupTimer);
  if (!city || !country) return;
  row.exportLookupTimer = setTimeout(() => lookupExportDestination(row), 750);
}

function recalculateInvoiceDistances() {
  [...invoiceList.querySelectorAll(".invoice-row")].forEach((row) => {
    const lat = row.querySelector('[name="notaLat"]').value;
    const lng = row.querySelector('[name="notaLng"]').value;
    if (lat && lng) setRowDistance(row, lat, lng);
  });
}

function isAdminLogged() {
  return sessionStorage.getItem(adminSessionKey) === "true";
}

function updateAdminStatus() {
  if (!adminStatus || !adminLoginButton) return;
  if (isAdminLogged()) {
    adminStatus.textContent = "Modo administrador ativo: é possível alterar ou excluir qualquer agendamento.";
    adminLoginButton.textContent = "Sair admin";
  } else {
    adminStatus.textContent = "Modo público: alterações exigem o código do agendamento.";
    adminLoginButton.textContent = "Admin";
  }
}

function requestScheduleAccess(item) {
  if (isAdminLogged()) return true;
  const code = prompt("Informe o código de alteração deste agendamento.");
  if (!code) return false;
  if (String(code).trim() === String(item.accessCode)) return true;
  alert("Código incorreto. Apenas o administrador ou quem possui o código pode alterar este agendamento.");
  return false;
}

function setEditingMode(item) {
  editingScheduleId = item.id;
  form.querySelector('button[type="submit"]').textContent = "Atualizar agendamento";
  cancelEditButton.hidden = false;
}

function clearEditingMode() {
  editingScheduleId = null;
  form.querySelector('button[type="submit"]').textContent = "Salvar agendamento";
  cancelEditButton.hidden = true;
}

function fillFormForEdit(item) {
  form.querySelector(`[name="operacao"][value="${item.operacao}"]`).checked = true;
  [
    "data",
    "hora",
    "doca",
    "prioridade",
    "motorista",
    "documento",
    "telefone",
    "transportadora",
    "placa",
    "carreta",
    "veiculo",
    "peso",
    "origem",
    "destino",
    "origemLat",
    "origemLng",
    "destinoLat",
    "destinoLng",
    "kmFinal",
    "observacoes",
  ].forEach((name) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = item[name] || "";
  });
  invoiceList.innerHTML = "";
  currentInvoiceContext = {};
  (item.notas || []).forEach((nota) => addInvoiceRow(nota));
  if (!invoiceList.children.length) addInvoiceRow();
  updateDateLabel();
  updateVehicleDurationHint();
  updateGateHint(false);
  updateDistancePreview(true);
  setEditingMode(item);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editSchedule(item) {
  if (!requestScheduleAccess(item)) return;
  fillFormForEdit(item);
}

async function deleteSchedule(item) {
  if (!isAdminLogged()) {
    alert("A exclusão é permitida apenas para administrador.");
    return;
  }
  if (!confirm(`Excluir o agendamento de ${item.transportadora} em ${item.data} às ${item.hora}?`)) return;
  try {
    await deleteScheduleRemote(item.id);
    schedules = schedules.filter((schedule) => schedule.id !== item.id);
    updateLinkedExcel(true);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function findConflictOutsideAffected(candidate, affectedIds) {
  const start = timeToMinutes(candidate.hora);
  const end = start + scheduleDuration(candidate);
  return schedules.find((item) => {
    if (affectedIds.has(item.id) || item.data !== candidate.data || item.doca !== candidate.doca) {
      return false;
    }
    const itemStart = timeToMinutes(item.hora);
    const itemEnd = itemStart + scheduleDuration(item);
    return start < itemEnd && end > itemStart;
  });
}

function buildDelayPlan(source, delayMinutes) {
  const originalStart = timeToMinutes(source.hora);
  const affected = schedules
    .filter((item) => item.data === source.data && item.doca === source.doca && timeToMinutes(item.hora) >= originalStart)
    .sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));
  const affectedIds = new Set(affected.map((item) => item.id));
  const updates = [];
  const blocked = [];
  let nextStart = originalStart + delayMinutes;

  affected.forEach((item) => {
    let candidateStart = nextWorkingStart(item, nextStart);
    let guard = 0;

    while (candidateStart !== null && guard < 20) {
      const candidate = { ...item, hora: minutesToTime(candidateStart) };
      const conflict = findConflictOutsideAffected(candidate, affectedIds);
      if (!conflict) break;
      candidateStart = nextWorkingStart(item, timeToMinutes(conflict.hora) + scheduleDuration(conflict));
      guard += 1;
    }

    if (candidateStart === null) {
      blocked.push(item);
      return;
    }

    const newHora = minutesToTime(candidateStart);
    updates.push({
      id: item.id,
      oldHora: item.hora,
      newHora,
      endHora: minutesToTime(candidateStart + scheduleDuration(item)),
      item,
    });
    nextStart = candidateStart + scheduleDuration(item);
  });

  return { updates, blocked };
}

async function applyDelayPlan(plan, source, delayMinutes) {
  const updateMap = new Map(plan.updates.map((update) => [update.id, update]));
  schedules = schedules.map((item) => {
    const update = updateMap.get(item.id);
    if (!update) return item;
    return {
      ...item,
      hora: update.newHora,
      atrasoMin: item.id === source.id ? delayMinutes : item.atrasoMin || "",
      horarioOriginal: item.horarioOriginal || update.oldHora,
      avisoAtraso:
        item.id === source.id
          ? `Atraso informado pelo administrador: ${delayMinutes} min. Entrada reprogramada de ${update.oldHora} para ${update.newHora}.`
          : `Reprogramado por atraso anterior no mesmo portão: ${update.oldHora} para ${update.newHora}.`,
    };
  });
  try {
    await saveSchedules();
    updateLinkedExcel(true);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function reportDelay(item) {
  if (!isAdminLogged()) {
    alert("A reprogramação por atraso é permitida apenas para administrador.");
    return;
  }
  const input = prompt("Quantos minutos de atraso deseja informar?");
  if (!input) return;
  const delayMinutes = Number(String(input).replace(/\D/g, ""));
  if (!delayMinutes || delayMinutes < 1) {
    alert("Informe um atraso válido em minutos.");
    return;
  }

  const plan = buildDelayPlan(item, delayMinutes);
  if (!plan.updates.length) {
    alert(`Não encontrei novo horário dentro da jornada. ${workingHoursLabel(item)}.`);
    return;
  }

  const lines = plan.updates.map(
    (update) =>
      `${update.item.transportadora} / ${update.item.placa}: ${update.oldHora} -> ${update.newHora} até ${update.endHora}`,
  );
  const blockedText = plan.blocked.length
    ? `\n\nSem encaixe no mesmo dia: ${plan.blocked.map((blocked) => `${blocked.transportadora} ${blocked.placa}`).join(", ")}.`
    : "";
  const message = `Nova programação para ${item.doca} em ${item.data}:\n\n${lines.join("\n")}${blockedText}\n\nDeseja aplicar esses novos horários?`;

  if (confirm(message)) {
    applyDelayPlan(plan, item, delayMinutes);
  }
}

function render() {
  const selectedDate = filterDate.value;
  const visible = schedules
    .filter((item) => !selectedDate || item.data === selectedDate)
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));

  timeline.innerHTML = "";

  if (!visible.length) {
    timeline.innerHTML = '<div class="empty">Nenhuma janela encontrada para o filtro selecionado.</div>';
  } else {
    visible.forEach((item) => timeline.append(createSlot(item)));
  }

  const notesCount = schedules.reduce((total, item) => total + countInvoiceNumbers(item.notas), 0);
  totals.agenda.textContent = schedules.length;
  totals.hoje.textContent = schedules.filter((item) => item.data === today).length;
  totals.notas.textContent = notesCount;
  renderMonth();
}

function createSlot(item) {
  const slot = document.createElement("article");
  slot.className = "slot";
  if (item.prioridade === "Critica" || item.prioridade === "Crítica") slot.classList.add("critical");
  if (item.operacao === "Expedicao") slot.classList.add("export");

  const invoiceText = item.notas
    .map((nota) => {
      const label = `NF ${nota.numero}`;
      const weight = nota.peso ? ` / ${nota.peso}` : "";
      return `${label} / ${nota.parceiro} / ${nota.volumes} vol.${weight}`;
    })
    .join(" | ");

  slot.innerHTML = `
    <div class="slot-time">${item.hora}<span>${scheduleEndTime(item)}</span></div>
    <div>
      <div class="slot-title">
        <strong>${item.data} - ${item.doca}</strong>
        <span class="badge">${item.operacao}</span>
      </div>
      <p><strong>${item.motorista}</strong> - ${item.transportadora} - ${item.placa}</p>
      <p>${item.veiculo} - ${item.peso} - ${scheduleDuration(item)} min reservados${scheduleRuleLabel(item) ? ` - ${scheduleRuleLabel(item)}` : ""} - Prioridade ${item.prioridade}</p>
      <p>${item.origem || "Origem não informada"} -> ${item.destino || "Destino não informado"} - ${item.kmFinal || item.kmEstimado || "0"} km</p>
      <p>${invoiceText}</p>
      ${item.avisoAtraso ? `<p class="delay-note">${item.avisoAtraso}</p>` : ""}
      ${item.observacoes ? `<p>${item.observacoes}</p>` : ""}
      <p class="slot-code">${isAdminLogged() ? `Código para alteração: <strong>${item.accessCode}</strong>` : "Para alterar este agendamento, use o código recebido no salvamento."}</p>
      <div class="slot-actions">
        <button type="button" class="secondary edit-schedule">Alterar</button>
        ${isAdminLogged() ? '<button type="button" class="secondary reminder-schedule">WhatsApp lembrete</button>' : ""}
        ${isAdminLogged() ? '<button type="button" class="secondary delay-schedule">Informar atraso</button>' : ""}
        <button type="button" class="remove-note delete-schedule">Excluir</button>
      </div>
    </div>
  `;
  slot.querySelector(".edit-schedule").addEventListener("click", () => editSchedule(item));
  slot.querySelector(".reminder-schedule")?.addEventListener("click", () => openReminderWhatsApp(item));
  slot.querySelector(".delay-schedule")?.addEventListener("click", () => reportDelay(item));
  slot.querySelector(".delete-schedule").addEventListener("click", () => deleteSchedule(item));
  return slot;
}

function renderMonth() {
  monthGrid.innerHTML = "";
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());
  const monthName = firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  monthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = dateToISO(date);
    const dayItems = schedules
      .filter((item) => item.data === isoDate)
      .sort((a, b) => a.hora.localeCompare(b.hora));
    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (date.getMonth() !== month) cell.classList.add("muted-day");
    if (isoDate === today) cell.classList.add("today-cell");
    cell.innerHTML = `<div class="day-number">${date.getDate()}<span>${dayItems.length ? `${dayItems.length} marcado(s)` : ""}</span></div>`;

    dayItems.forEach((item) => {
      const event = document.createElement("button");
      event.type = "button";
      event.className = `month-event ${item.operacao === "Expedicao" ? "export" : ""}`;
      event.innerHTML = `
        <strong>${item.hora}-${scheduleEndTime(item)}</strong>
        <span>${operationCalendarLabel(item.operacao)} | ${item.veiculo}</span>
        <small>${item.doca}</small>
      `;
      event.addEventListener("click", () => {
        filterDate.value = item.data;
        render();
        document.querySelector(".board").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      cell.append(event);
    });

    monthGrid.append(cell);
  }
}

function excelRows() {
  const header = [
    "Data",
    "Hora",
    "Horário final",
    "Operação",
    "Portão",
    "Transportadora",
    "Motorista",
    "Telefone",
    "Placa",
    "Tipo de veículo",
    "Origem",
    "Destino",
      "KM direto",
      "KM rodoviário",
      "Tempo estimado",
      "Número NF",
    "Fornecedor / cliente",
    "CNPJ",
    "Tipo destino",
    "Cidade exportação",
    "País exportação",
    "Volumes",
    "Peso da NF",
    "Dados do destino",
  ];
  const detailRows = schedules.flatMap((item) =>
    item.notas.map((nota) => {
      const route = noteRoute(item, nota);
      return [
        item.data,
        item.hora,
        scheduleEndTime(item),
        item.operacao,
        item.doca,
        item.transportadora,
        item.motorista,
        item.telefone,
        item.placa,
        item.veiculo,
        route.origem,
        route.destino,
        nota.kmReta || item.kmReta || "",
        nota.kmEstimado || item.kmFinal || item.kmEstimado || "",
        formatTravelTime(nota.kmEstimado || item.kmFinal || item.kmEstimado || "", item.veiculo),
        nota.numero || "",
        nota.parceiro || "",
        nota.cnpj || "",
        nota.destinoTipo || "brasil",
        nota.cidadeExportacao || "",
        nota.paisExportacao || "",
        nota.volumes || "",
        nota.peso || "",
        nota.local || "",
      ];
    }),
  );
  return [header, ...detailRows];
}

function excelBlob() {
  const rows = excelRows();
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td style="mso-number-format:'\\@';">${String(cell ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const workbook = `<!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          td { border: 1px solid #999; padding: 6px 8px; white-space: nowrap; }
          tr:first-child td { background: #050505; color: #fff; font-weight: bold; }
        </style>
      </head>
      <body><table>${tableRows}</table></body>
    </html>`;
  return new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
}

function exportExcel() {
  const blob = excelBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agenda-sandvik.xls";
  link.click();
  URL.revokeObjectURL(url);
}

function noteRoute(item, nota) {
  const noteAddress = noteAddressFromData(nota);
  if (item.operacao === "Expedicao") {
    return {
      origem: sandvikAddress,
      destino: noteAddress || item.destino || "",
    };
  }
  return {
    origem: noteAddress || item.origem || "",
    destino: sandvikAddress,
  };
}

function noteAddressFromData(nota) {
  if (nota.destinoTipo === "exportacao") {
    return [nota.cidadeExportacao, nota.paisExportacao].filter(Boolean).join(", ");
  }
  const parts = String(nota.local || "").split(" | ");
  const address = parts.find((part) => /\d|rua|avenida|av\.|rodovia|estrada|centro|bairro/i.test(part));
  return address || parts[1] || parts[0] || "";
}

function openExcelDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sandvik-agenda-db", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("handles");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveExcelHandle(handle) {
  const db = await openExcelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    tx.objectStore("handles").put(handle, excelHandleStore);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadExcelHandle() {
  const db = await openExcelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readonly");
    const request = tx.objectStore("handles").get(excelHandleStore);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function ensureExcelPermission(handle) {
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  return (await handle.requestPermission(options)) === "granted";
}

async function writeExcelHandle(handle) {
  if (!(await ensureExcelPermission(handle))) {
    throw new Error("Permissão negada para atualizar a planilha.");
  }
  const writable = await handle.createWritable();
  await writable.write(excelBlob());
  await writable.close();
}

async function linkExcelFile() {
  if (!window.showSaveFilePicker) {
    alert("Este navegador não permite vincular arquivo local. Use o botão Excel e salve na pasta do SharePoint.");
    return;
  }
  const handle = await window.showSaveFilePicker({
    suggestedName: "agenda-sandvik.xls",
    types: [
      {
        description: "Planilha Excel",
        accept: { "application/vnd.ms-excel": [".xls"] },
      },
    ],
  });
  await saveExcelHandle(handle);
  await writeExcelHandle(handle);
  alert("Planilha vinculada e atualizada. Salve/vincule dentro da pasta do SharePoint sincronizada.");
}

async function updateLinkedExcel(silent = false) {
  const handle = await loadExcelHandle();
  if (!handle) {
    if (!silent) alert("Nenhuma planilha vinculada. Clique em Vincular e escolha a pasta do SharePoint.");
    return false;
  }
  try {
    await writeExcelHandle(handle);
    if (!silent) alert("Planilha vinculada atualizada.");
    return true;
  } catch (error) {
    if (!silent) alert(error.message);
    return false;
  }
}

addNotaButton.addEventListener("click", () => addInvoiceRow());
filterDate.addEventListener("input", render);
exportCsvButton.addEventListener("click", exportExcel);
adminLoginButton.addEventListener("click", () => {
  if (isAdminLogged()) {
    sessionStorage.removeItem(adminSessionKey);
    updateAdminStatus();
    render();
    return;
  }
  const pin = prompt("Digite a senha do administrador.");
  if (pin === adminPin) {
    sessionStorage.setItem(adminSessionKey, "true");
    updateAdminStatus();
    render();
  } else if (pin) {
    alert("Senha de administrador incorreta.");
  }
});
linkExcelButton.addEventListener("click", () => linkExcelFile().catch((error) => alert(error.message)));
saveExcelButton.addEventListener("click", () => updateLinkedExcel(false));
prevMonthButton.addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderMonth();
});
nextMonthButton.addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderMonth();
});
lookupCnpjsButton.addEventListener("click", async () => {
  const rows = [...invoiceList.querySelectorAll(".invoice-row")];
  for (const row of rows) {
    const isExport = row.querySelector('[name="notaDestinoTipo"]').value === "exportacao";
    if (isExport || row.querySelector('[name="notaCnpj"]').value.trim()) await lookupLotDestination(row);
  }
});
form.addEventListener("input", (event) => {
  applyTextFormatting(event.target);
  if (["origemLat", "origemLng", "destinoLat", "destinoLng"].includes(event.target.name)) {
    syncSandvikDestination();
    updateDistancePreview(true);
    recalculateInvoiceDistances();
  }
  if (event.target.name === "operacao") {
    updateDateLabel();
    syncSandvikDestination();
    updateGateHint(true);
    updateVehicleDurationHint();
  }
  if (["veiculo", "peso"].includes(event.target.name)) {
    updateVehicleDurationHint();
    updateGateHint(true);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formatAllTextFields();
  const data = new FormData(form);
  const schedule = Object.fromEntries(data.entries());
  if (!isValidMobile(schedule.telefone)) {
    alert("O celular do motorista é obrigatório e deve ser informado com DDD, no formato (00) 00000-0000.");
    form.querySelector('[name="telefone"]').focus();
    return;
  }
  const previousSchedule = editingScheduleId ? schedules.find((item) => item.id === editingScheduleId) : null;
  schedule.id = previousSchedule?.id || crypto.randomUUID();
  schedule.accessCode = previousSchedule?.accessCode || createAccessCode();
  schedule.notas = collectInvoices();
  schedule.duracaoMin = scheduleDuration({ ...schedule, duracaoMin: null });
  const expectedGate = recommendedGate(schedule);
  const distance = currentDistance();
  if (distance) {
    schedule.kmReta = distance.kmReta;
    schedule.kmEstimado = distance.kmEstimado;
    schedule.kmFinal = String(schedule.kmFinal || distance.kmEstimado).replace(",", ".");
  }

  if (schedule.doca !== expectedGate) {
    alert(`${expectedGate} deve ser usado para esta operação. ${gateReason(schedule)}`);
    form.querySelector('[name="doca"]').value = expectedGate;
    return;
  }

  if (!scheduleWithinWorkingHours(schedule)) {
    const suggestion = nextAvailableSlot(schedule);
    const suggestionText = suggestion
      ? `\n\nHorário mais próximo disponível: ${suggestion.start} às ${suggestion.end}.`
      : "\n\nNão encontrei outro horário livre dentro da jornada desse mesmo dia.";
    alert(
      `Esse agendamento está fora do horário de atendimento ou termina depois do limite permitido.` +
        `\n${workingHoursLabel(schedule)}.` +
        suggestionText,
    );
    if (suggestion) {
      form.querySelector('[name="hora"]').value = suggestion.start;
    }
    return;
  }

  if (hasDockConflict(schedule)) {
    const conflict = findDockConflict(schedule);
    const suggestion = nextAvailableSlot(schedule);
    const suggestionText = suggestion
      ? `\n\nHorário mais próximo disponível: ${suggestion.start} às ${suggestion.end}.`
      : "\n\nNão encontrei outro horário livre dentro da jornada desse mesmo dia.";
    alert(
      `Já existe um agendamento nesse portão dentro da janela de tempo calculada para este veículo/material.` +
        `\nConflito: ${conflict.operacao} das ${conflict.hora} às ${scheduleEndTime(conflict)}.` +
        suggestionText,
    );
    if (suggestion) {
      form.querySelector('[name="hora"]').value = suggestion.start;
    }
    return;
  }

  let savedSchedule;
  try {
    savedSchedule = await saveScheduleRemote(schedule);
  } catch (error) {
    alert(error.message);
    await refreshSchedules();
    return;
  }

  schedules = previousSchedule
    ? schedules.map((item) => (item.id === previousSchedule.id ? savedSchedule : item))
    : [...schedules, savedSchedule];
  localStorage.setItem(storageKey, JSON.stringify(schedules));
  updateLinkedExcel(true);
  alert(
    previousSchedule
      ? "Agendamento atualizado com sucesso."
      : `Agendamento salvo com sucesso. Código para alteração: ${savedSchedule.accessCode}. Guarde esse código para conseguir editar este agendamento depois.`,
  );
  form.reset();
  invoiceList.innerHTML = "";
  currentInvoiceContext = {};
  clearEditingMode();
  addInvoiceRow();
  updateDistancePreview();
  render();
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    invoiceList.innerHTML = "";
    currentInvoiceContext = {};
    clearEditingMode();
    addInvoiceRow();
    updateDistancePreview();
    updateVehicleDurationHint();
    updateGateHint(true);
  });
});

cancelEditButton.addEventListener("click", () => {
  form.reset();
});

function addMessage(text, type = "bot") {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  if (type === "bot") {
    message.innerHTML = text;
  } else {
    message.textContent = text;
  }
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function aiReply(question) {
  const text = question.toLowerCase();
  const availability = availabilityReply(question);
  if (availability) return availability;
  const contacts =
    'Recebimento: <a href="https://wa.me/5511913664451" target="_blank" rel="noopener">11 91366-4451</a>, atendimento das 08:00 às 11:30 e das 13:30 às 16:00. Emails: <a href="mailto:bruno.santos@sandvik.com">bruno.santos@sandvik.com</a> e <a href="mailto:luiz_gustavo.neco@sandvik.com">luiz_gustavo.neco@sandvik.com</a>.<br>Expedição: <a href="https://wa.me/5511994509328" target="_blank" rel="noopener">11 99450-9328</a>, atendimento das 08:00 às 12:00 e das 13:30 às 17:00. Emails: <a href="mailto:emerson.a.oliveira@sandvik.com">emerson.a.oliveira@sandvik.com</a> e <a href="mailto:maicon.souza@sandvik.com">maicon.souza@sandvik.com</a>.';
  const mandatory =
    "O agendamento é obrigatório para entregas e coletas. Caso não tenha sido agendado, não receberemos o material e nem carregaremos o material.";
  const safety =
    "Para adentrar na empresa, o motorista deve estar usando capacete, óculos de segurança, calçado de segurança e protetor auricular.";
  if (
    text.includes("obrigatorio") ||
    text.includes("obrigatório") ||
    text.includes("sem agendamento") ||
    text.includes("precisa agendar") ||
    text.includes("agendar")
  ) {
    return `${mandatory} ${contacts}`;
  }
  if (text.includes("contato") || text.includes("telefone") || text.includes("horario") || text.includes("horário")) {
    return contacts;
  }
  if (includesAny(text, ["ajuda", "duvida", "dúvida", "como funciona", "como preencher", "o que fazer", "estou perdido", "nao sei", "não sei"])) {
    return helpSummary();
  }
  if (includesAny(text, ["lembrete", "whatsapp", "mensagem", "atraso", "tolerancia", "tolerância"])) {
    return "O celular do motorista é obrigatório. No modo administrador, use o botão WhatsApp lembrete no agendamento para abrir uma mensagem pronta ao motorista, informando data, horário, portão, tolerância máxima de 5 minutos e o código para ajustar a coleta/entrega.";
  }
  if (includesAny(text, ["epi", "seguranca", "segurança", "capacete", "oculos", "óculos", "calcado", "calçado", "protetor", "auricular", "entrar na empresa", "adentrar"])) {
    return safety;
  }
  if (includesAny(text, ["motorista", "placa", "documento", "cpf", "telefone"])) {
    return "Nos dados do motorista, informe nome completo, documento/CPF, telefone, transportadora, placa do cavalo e placa da carreta quando existir. O site ajusta nomes com iniciais maiúsculas e placas em letras maiúsculas automaticamente.";
  }
  if (includesAny(text, ["peso", "volume", "volumes", "tonelada", "ton", "kg"])) {
    return "Informe peso e volumes com cuidado. O peso do veículo/material define regras importantes: acima de 2,5 t em descarga usa Portão 1 com ponte rolante; prancha em expedição acima de 10 t reserva 4 horas.";
  }
  if (includesAny(text, ["origem", "destino", "distancia", "km", "quilometragem", "localizacao", "localização", "endereco", "endereço"])) {
    return "A origem e o destino são preenchidos automaticamente quando você busca o CNPJ ou informa cidade/país de exportação. Em descarga, o fornecedor vira origem e a Sandvik vira destino. Em expedição, a Sandvik vira origem e o cliente vira destino. A distância direta e rodoviária aparece no resumo da viagem.";
  }
  if (includesAny(text, ["erro", "nao salvou", "não salvou", "bloqueou", "conflito", "ocupado"])) {
    return "Se o sistema bloqueou, normalmente existe conflito de horário no mesmo portão ou o portão selecionado não combina com a operação/peso. Verifique a agenda mensal, o horário final calculado e a sugestão de portão abaixo do campo.";
  }
  if (text.includes("doca") || text.includes("portao") || text.includes("portão")) {
    return "Temos três portões: Portão 1 para descarga direta na produção com ponte rolante, Portão 2 para expedição/carregamento, e Portão 3 para descarga comum de material.";
  }
  if (text.includes("ponte") || text.includes("empilhadeira") || text.includes("2,5") || text.includes("2.5")) {
    return "Descarga acima da capacidade da empilhadeira de 2,5 t deve usar o Portão 1 com ponte rolante. O sistema reserva 90 minutos para descarga sem etiquetagem.";
  }
  if (text.includes("prancha") || text.includes("peneira") || text.includes("10t") || text.includes("10 t")) {
    return "Carregamento de prancha para peneiras ou materiais acima de 10 t reserva 4 horas no Portão 2. Para tempo de viagem, o sistema considera prancha com deslocamento diurno: ela roda apenas na janela de dia e o tempo pode aparecer como 1 dia e 4 horas, por exemplo.";
  }
  if (text.includes("fiorino") || text.includes("van") || text.includes("tempo") || text.includes("intervalo")) {
    return "O tipo de transporte é por ocupação/capacidade: carro de passeio, utilitário pequeno, utilitário médio/van, caminhão 3/4, truck/trucado, carreta ou prancha. O tempo reservado muda conforme essa categoria.";
  }
  if (text.includes("nota") || text.includes("nf") || text.includes("cnpj")) {
    return "Cadastre cada NF em uma linha separada. Cada nota tem fornecedor/cliente, CNPJ ou destino de exportação, volume e peso próprios. A planilha Excel sai com uma linha por NF, repetindo data, transportadora, KM e tipo de veículo automaticamente.";
  }
  if (text.includes("exportacao") || text.includes("exportação") || text.includes("pais") || text.includes("país") || text.includes("exterior")) {
    return "Para cliente de exportação, no lote da nota selecione Tipo do destino: Exportação / cidade e país. Depois informe o nome do cliente, a cidade e o país para onde a carga vai. O sistema busca a localização e calcula a distância até a Sandvik Taubaté quando possível.";
  }
  if (text.includes("transportadora") || text.includes("fornecedor") || text.includes("caninde") || text.includes("emenbelt")) {
    return "O cadastro é por transportadora, mas as NFs ficam separadas por fornecedor ou cliente. Preencha a transportadora uma vez nos dados do veículo, depois adicione um lote para cada fornecedor com CNPJ, números de NF, volumes e peso do lote.";
  }
  if (text.includes("calendario") || text.includes("agenda") || text.includes("mes")) {
    return "A agenda mensal mostra o mês completo como calendário de email. Dias com entrega ou coleta aparecem marcados; clique no horário para filtrar a agenda diária daquele dia.";
  }
  if (text.includes("csv") || text.includes("excel") || text.includes("planilha") || text.includes("export")) {
    return "Use o botão Excel na agenda diária para gerar a planilha. Ela sai com uma linha por NF, separando transportadora, data, hora, portão, origem, destino, KM, tempo estimado, tipo de veículo, fornecedor/cliente, volume e peso de cada nota.";
  }
  if (text.includes("coleta") || text.includes("entrega")) {
    return "Quando a operação for Descarga, o campo aparece como Data da entrega. Quando for Expedição, aparece como Data da coleta.";
  }
  return `Não consegui solucionar essa dúvida com segurança. ${mandatory} ${safety} ${contacts}`;
}

chatToggle.addEventListener("click", () => chatPanel.classList.toggle("open"));
chatClose.addEventListener("click", () => chatPanel.classList.remove("open"));
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  addMessage(question, "user");
  chatInput.value = "";
  setTimeout(() => addMessage(aiReply(question)), 250);
});

addInvoiceRow();
syncSandvikDestination();
filterDate.value = today;
updateDistancePreview();
updateDateLabel();
updateVehicleDurationHint();
updateGateHint();
updateAdminStatus();
refreshSchedules();
