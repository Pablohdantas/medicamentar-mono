import axiosInstance from "@utils/axiosInstance";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Modal,
  Button,
  Select,
  Checkbox,
  MenuItem,
  FormGroup,
  TextField,
  InputLabel,
  Typography,
  IconButton,
  AlertColor,
  FormControl,
  Autocomplete,
  FormControlLabel,
} from "@mui/material";
import { useTheme } from "@theme/useTheme";
import CloseIcon from "@mui/icons-material/Close";
import { useLocalStorage } from "@hooks/UseLocalStorage";
import { DateTimePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Feedback } from "@components/Feedback";
import { Loader } from "@components/Loader";

interface ModalEditMedicineProps {
  isOpen: boolean;
  id: string | null;
  onClose: () => void;
  fetchMedications: () => Promise<void>;
  currentMedication: MedicationProps | null;
  showFeedback: (message: string, severity: "success" | "error") => void;
}
interface MedicationProps {
  id: string;
  name: string;
  type: string;
  dose: number;
  unity: string;
  amount: number;
  period: number;
  endDate: dayjs.Dayjs;
  startDate: dayjs.Dayjs;
  continuousUse: boolean;
}

interface FormErrors {
  name?: string;
  type?: string;
  dose?: string;
  unity?: string;
  amount?: string;
  period?: string;
  endDate?: string;
  continuo?: string;
  startDate?: string;
}

const frequencyOptions = [
  { value: 2, label: "A cada 2 Horas" },
  { value: 4, label: "A cada 4 Horas" },
  { value: 6, label: "A cada 6 Horas" },
  { value: 8, label: "A cada 8 Horas" },
  { value: 12, label: "A cada 12 Horas" },
  { value: 24, label: "A cada 24 Horas" },
  { value: 168, label: "Semanal" },
];

const periodOptions = [
  { value: 5, label: "5 Dias" },
  { value: 7, label: "7 Dias" },
  { value: 10, label: "10 Dias" },
  { value: 12, label: "12 Dias" },
  { value: 15, label: "15 Dias" },
  { value: 20, label: "20 Dias" },
  { value: 25, label: "25 Dias" },
  { value: 30, label: "30 Dias" },
];

enum Type {
  ORAL = 0,
  TOPICO = 1,
  OFTALMICO = 2,
  INTRANASAL = 3,
  INJETAVEL = 4,
  SUBLINGUAL = 5,
  TRANSDERMICO = 6,
  RETAL = 7,
  VAGINAL = 8,
}

enum Unity {
  mililitros = 0,
  miligramas = 1,
  gotas = 2,
  comprimidos = 3,
  subcutanea = 4,
}


const ModalEditMedicine = ({id, isOpen, onClose, fetchMedications, currentMedication, showFeedback }: ModalEditMedicineProps) => {
  const { darkMode, largeFont } = useTheme();
  const [user] = useLocalStorage<{ token: { data: string } } | null>(
    "user",
    null
  );
  const [name, setName] = useState<string>("");
  const [tipoMedicamento, setTipoMedicamento] = useState<number>(
    Type[currentMedication?.type as keyof typeof Type]
  );
  const [dose, setDose] = useState<number>(1);
  const [amount, setAmount] = useState<number>(1);
  const [unity, setUnity] = useState<number>(
    Unity[currentMedication?.unity as keyof typeof Unity]
  );
  const [continuo, setContinuo] = useState<boolean>(
    currentMedication?.continuousUse || false
  );
  const [period, setPeriod] = useState<number>(1);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage] = useState("");
  const [feedbackSeverity] = useState<AlertColor>("success");

  const [loading, setLoading] = useState(false);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "O nome do medicamento é obrigatório.";
    if (!startDate) newErrors.startDate = "A data de início é obrigatória.";
    return newErrors;
  };
  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen && currentMedication) {
      setName(currentMedication.name || "");
      setTipoMedicamento(tipoMedicamento);
      setDose(currentMedication.dose || 1);
      setAmount(currentMedication.amount || 1);
      setUnity(unity);
      setContinuo(currentMedication.continuousUse);
      setPeriod(currentMedication.dose || 1);
      setStartDate(
        currentMedication.startDate ? dayjs(currentMedication.startDate) : null
      );
    }
  }, [open, currentMedication]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      _setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await axiosInstance({
        headers: { Authorization: `Bearer ${user?.token.data}` },
        method: "put",
        url: `/medication/${id}`,
        data: {
          name: name,
          type: Number(tipoMedicamento),
          dose: dose,
          amount: amount,
          unity: Number(unity),
          period: period,
          isContinuousUse: continuo,
          start_date: startDate,
          /*ophthalmicDetails: {
            leftEyeFrequency: null, 
            leftEyeQuantity: null, 
            leftEyeDrops: null, 
            rightEyeFrequency: null, 
            rightEyeQuantity: null, 
            rightEyeDrops: null, 
            }, */
        },
      });
      onClose();
      showFeedback("Medicamento editado com sucesso!", "success");
      fetchMedications();
    } catch (error) {
      console.error("Erro na requisição:", error);
      showFeedback("Medicamento editado com sucesso!", "success");
    } finally {
      setLoading(false);
    }
  };

  const [errors, _setErrors] = useState<FormErrors>({});

  const themedProps = {
    textField: {
      InputProps: {
        sx: {
          "& .MuiInputAdornment-root .MuiSvgIcon-root": {
            color: darkMode ? "#CDCED7" : "-moz-initial",
            fontSize: largeFont ? "1.4rem" : "1.2rem",
          },
          fontSize: largeFont ? "1.4rem" : "0.9rem",
          color: darkMode ? "common.white" : "text.primary",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: darkMode ? "rgba(128, 128, 128, 0.6)" : "-moz-initial",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: darkMode ? "common.white" : "primary.main",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: darkMode ? "#103952" : "primary.main",
          },
        },
      },
      InputLabelProps: {
        sx: {
          fontSize: largeFont ? "1.2rem" : "0.9rem",
          color: darkMode ? "common.white" : "text.primary",
          "&.Mui-focused": {
            color: darkMode ? "#103952" : "primary.main",
          },
        },
      },
    },
  };

  const gridTransition = {
    transition: "all 0.3s ease-in-out",
  };

  return (
    <>
      <Feedback
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        severity={feedbackSeverity}
        message={feedbackMessage}
      />
      <Modal open={isOpen} onClose={onClose}>
        <Box
          component="div"
          sx={{
            position: "absolute",
            p: largeFont ? "40px" : "60px",
            top: "50%",
            gap: largeFont ? "5px" : "10px",
            left: "50%",
            boxShadow: 24,
            display: "flex",
            borderRadius: "5px",
            alignItems: "center",
            flexDirection: "column",
            width: { xs: "90%", md: "720px" },
            height: { xs: "1", md: "auto" },
            transform: "translate(-50%, -50%)",
            backgroundColor: darkMode ? "grey.900" : "common.white",
            transition: "all 0.3s ease-in-out",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              top: 30,
              right: 30,
              position: "absolute",
              color: "#80828D",
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h3"
            sx={{
              p: "20px 0 50px 0",
              fontSize: "1.8rem",
              fontWeight: 600,
              textAlign: "center",
              color: darkMode ? "primary.light" : "primary.main",
            }}
          >
            EDITAR MEDICAMENTO
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} sx={gridTransition}>
                  <FormControl
                    fullWidth
                    sx={{
                      fontSize: "0.9rem",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <InputLabel id="type-label">TIPO DE MEDICAMENTO</InputLabel>
                    <Select
                      id="tipo"
                      value={tipoMedicamento}
                      label="TIPO DE MEDICAMENTO"
                      labelId="type-label"
                      onChange={(event) =>
                        setTipoMedicamento(Number(event.target.value))
                      }
                    >
                      <MenuItem value={Type.ORAL}>ORAL</MenuItem>
                      <MenuItem value={Type.TOPICO}>TÓPICO</MenuItem>
                      <MenuItem value={Type.OFTALMICO}>OFTÁLMICO</MenuItem>
                      <MenuItem value={Type.INTRANASAL}>INTRANASAL</MenuItem>
                      <MenuItem value={Type.INJETAVEL}>INJETÁVEL</MenuItem>
                      <MenuItem value={Type.SUBLINGUAL}>SUBLINGUAL</MenuItem>
                      <MenuItem value={Type.TRANSDERMICO}>
                        TRANSDÉRMICO
                      </MenuItem>
                      <MenuItem value={Type.RETAL}>RETAL</MenuItem>
                      <MenuItem value={Type.VAGINAL}>VAGINAL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} sx={gridTransition}>
                  <TextField
                    sx={{
                      fontSize: "0.9rem",
                      transition: "all 0.3s ease-in-out",
                    }}
                    variant="outlined"
                    label="NOME DO MEDICAMENTO"
                    value={name}
                    fullWidth
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        _setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={6} sx={gridTransition}>
                  <FormControl fullWidth>
                    <Autocomplete
                      value={dose?.toString()}
                      onChange={(_event, newValue) => {
                        if (newValue) {
                          const numValue = Number(
                            newValue.replace(/[^0-9]/g, "")
                          );
                          setDose(Number(Math.max(1, numValue)));
                        }
                      }}
                      freeSolo
                      options={frequencyOptions.map((option) => option.label)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="FREQUÊNCIA"
                          type="number"
                          value={dose?.toString()}
                          onChange={(event) => {
                            const numValue = Number(event.target.value);
                            setDose(Number(Math.max(1, numValue)));
                          }}
                          inputProps={{
                            ...params.inputProps,
                            min: 1,
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} md={6} sx={gridTransition}>
                  <TextField
                    sx={{
                      fontSize: "0.9rem",
                      transition: "all 0.3s ease-in-out",
                    }}
                    fullWidth
                    type="number"
                    value={amount}
                    variant="outlined"
                    label="QUANTIDADE"
                    onChange={(event) => {
                      if (Number(event.target.value) < 1) {
                        setAmount(1);
                      } else {
                        setAmount(Number(event.target.value));
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={6} sx={gridTransition}>
                  <FormControl
                    fullWidth
                    sx={{
                      fontSize: "0.9rem",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <InputLabel id="unity-label">UNIDADE</InputLabel>
                    <Select
                      id="unidade"
                      value={unity}
                      label="UNIDADE"
                      labelId="unity-label"
                      onChange={(event) => setUnity(Number(event.target.value))}
                    >
                      <MenuItem value={Unity.mililitros}>
                        Mililitros (ML)
                      </MenuItem>
                      <MenuItem value={Unity.miligramas}>
                        Miligramas (MG)
                      </MenuItem>
                      <MenuItem value={Unity.gotas}>Gotas (GTS)</MenuItem>
                      <MenuItem value={Unity.comprimidos}>
                        Comprimidos (CPS)
                      </MenuItem>
                      <MenuItem value={Unity.subcutanea}>
                        Subcutânea (SC)
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sx={gridTransition}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={continuo}
                        onChange={(e) => setContinuo(e.currentTarget.checked)}
                      />
                    }
                    label="USO CONTÍNUO"
                    sx={{
                      color: darkMode ? "common.white" : "common.black",
                      transition: "all 0.3s ease-in-out",
                      opacity: continuo ? 1 : 0.35,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sx={gridTransition}>
                  <DateTimePicker
                    views={["day", "hours", "minutes"]}
                    value={startDate}
                    label="DATA DE INÍCIO"
                    components={{
                      OpenPickerIcon: CalendarTodayIcon,
                    }}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                      if (errors.startDate)
                        _setErrors((prev) => ({
                          ...prev,
                          startDate: undefined,
                        }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText={errors.startDate}
                        error={Boolean(errors.startDate)}
                        InputProps={{
                          ...params.InputProps,
                          ...themedProps.textField.InputProps,
                          inputProps: {
                            ...params.inputProps,
                            readOnly: true,
                            style: {
                              fontSize: largeFont ? "1.4rem" : "0.9rem",
                              padding: largeFont ? "16px 14px" : "10px 14px",
                            },
                          },
                        }}
                        InputLabelProps={{
                          ...params.InputLabelProps,
                          ...themedProps.textField.InputLabelProps,
                          style: {
                            fontSize: largeFont ? "1.2rem" : "0.9rem",
                            transform: largeFont ? "translate(14px, -12px) scale(0.75)" : "translate(14px, -6px) scale(0.75)",
                          },
                        }}
                        sx={{
                          "& .MuiFormHelperText-root": {
                            fontSize: largeFont ? "1rem" : "0.75rem",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={gridTransition}>
                  <FormControl fullWidth>
                    <Autocomplete
                      disabled={continuo}
                      value={period?.toString()}
                      sx={{
                        opacity: continuo ? 0.5 : 1,
                      }}
                      onChange={(_, newValue) => {
                        if (newValue) {
                          const numValue = Number(
                            newValue.replace(/[^0-9]/g, "")
                          );
                          setPeriod(Math.max(1, numValue));
                        }
                      }}
                      freeSolo
                      options={periodOptions.map((option) => option.label)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          type="number"
                          value={period}
                          label="PERÍODO"
                          disabled={continuo}
                          onChange={(e) => {
                            const numValue = Number(e.target.value);
                            setPeriod(Math.max(1, numValue));
                          }}
                          inputProps={{
                            ...params.inputProps,
                            min: 1,
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} sx={gridTransition}>
                  <TextField
                    disabled
                    fullWidth
                    value={""}
                    label="FINAL DO TRATAMENTO"
                    helperText={errors.endDate}
                    error={Boolean(errors.endDate)}
                    sx={{
                      opacity: continuo ? 0.5 : 1,
                    }}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  px: "20%",
                  mx: "auto",
                  my: "30px",
                  py: "18px",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                }}
              >
                {loading ? <Loader sx={{ color: "white" }} /> : "SALVAR"}
              </Button>
            </FormGroup>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default ModalEditMedicine;
