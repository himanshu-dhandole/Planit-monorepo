package com.teamarc.planit.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PointDTO {
    private double[] coordinates;
    private String type ="Point";

    public PointDTO(double[] coordiantes) {
        this.coordinates = coordiantes;
    }
}