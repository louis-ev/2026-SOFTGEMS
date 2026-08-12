import { describe, expect, it } from "vitest";
import {
  gemTreatmentTypeCode,
  gemTreatmentTypeFullLabel,
  gemTreatmentTypeTitle,
} from "@/utils/treatment_type_display.js";

describe("gemTreatmentTypeCode", () => {
  it("maps known lab strings to compact codes", () => {
    expect(gemTreatmentTypeCode("Natural")).toBe("N");
    expect(gemTreatmentTypeCode("No indications of heating")).toBe("No H");
    expect(gemTreatmentTypeCode("Indications of heating / TE")).toBe("TE");
    expect(
      gemTreatmentTypeCode(
        "Indications of heating with residues (TE1/2/3/4/5)",
      ),
    ).toBe("TE1–5");
    expect(
      gemTreatmentTypeCode(
        "Indications of heating with diffusion (Be/Ti/Cr)",
      ),
    ).toBe("U");
    expect(
      gemTreatmentTypeCode(
        "Indications of heating with Lead Glass filling (F1/2/3)",
      ),
    ).toBe("F1–3");
    expect(gemTreatmentTypeCode("Oil - Minor")).toBe("O Min");
    expect(gemTreatmentTypeCode("Resin - Significant")).toBe("RES Sig");
    expect(gemTreatmentTypeCode("Type A (Natural)")).toBe("Type A");
  });

  it("passes unknown values through", () => {
    expect(gemTreatmentTypeCode("Custom lab note")).toBe("Custom lab note");
  });
});

describe("gemTreatmentTypeFullLabel / title", () => {
  it("keeps the stored full string for hover", () => {
    const full = "No indications of heating";
    expect(gemTreatmentTypeFullLabel(full)).toBe(full);
    expect(gemTreatmentTypeTitle(full)).toBe(full);
  });
});
