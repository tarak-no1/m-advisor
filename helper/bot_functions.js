module.exports = (function () {
    let functionNamesObj = {
        "resetUserContext" : {
            "must_need" : ["reset"],
            "must_not" : []
        },
        "getSignalErrorMessage" : {
            "must_need" : ["signal_error"],
            "must_not" : []
        },
        "getGreetMessage" :{
            "must_need" : ["greetings"],
            "must_not" : []
        },
        "getTotalMeasuresInDataset" : {
            "must_need" : ["total", "measures"],
            "must_not" : []
        },
        "getTotalDimensionsInDataset" : {
            "must_need" : ["total", "dimensions"],
            "must_not" : []
        },
        "getColumnsInfoInDataset" : {
            "must_need" : ["measures", "non_numerical", "variables"],
            "must_not" : []
        },
        "getTotalObservations" : {
            "must_need" : ["total", "observations"],
            "must_not" : ["maximum", "minimum"]
        },
        "getTotalValuesInTargetColumn" : {
            "must_need" : ["total", "values", "target_column", "dimension_analysis"],
            "must_not" : ["maximum", "minimum"]
        },
        "getTotalValuesInTargetColumnInMeasureAnalysis" : {
            "must_need" : ["total", "values", "target_column", "measure_analysis"],
            "must_not" : ["maximum", "minimum"]
        },
        "getDistributionOfTargetColumn" : {
            "must_need" : ["distribution", "target_column", "dimension_analysis"],
            "must_not" : ["column_values", "columns"]
        },
        "getDistributionOfTargetColumnInMeasureAnalysis" : {
            "must_need" : ["distribution", "target_column", "measure_analysis"],
            "must_not" : ["column_values", "columns"]
        },
        "getDistributionOfTargetColumnAcrossColumnValue" : {
            "must_need" : ["distribution", "target_column", "column_values", "dimension_analysis"],
            "must_not" : ["columns"]
        },
        "getDistributionOfTargetColumnAcrossColumnValueInMeasureAnalysis" : {
            "must_need" : ["distribution", "target_column", "column_values", "measure_analysis"],
            "must_not" : ["columns"]
        },
        "getMaximumObservationsInAnalysis" : {
            "must_need" : ["maximum", "observations"],
            "must_not" : ["columns","column_values"]
        },
        "getNthMaximumObservationsInAnalysis" : {
            "must_need" : ["maximum", "ordinal", "observations"],
            "must_not" : ["columns","column_values"]
        },
        "getMaximumValueInTargetColumn" : {
            "must_need" : ["maximum", "target_column"],
            "must_not" : ["columns","column_values"]
        },
        "getNthMaximumInTargetColumn" : {
            "must_need" : ["maximum", "ordinal", "target_column"],
            "must_not" : ["columns", "column_values"]
        },
        "getMinimumObservationsInAnalysis" : {
            "must_need" : ["minimum", "observations"],
            "must_not" : ["columns","column_values"]
        },
        "getNthMinimumObservationsInAnalysis" : {
            "must_need" : ["minimum", "ordinal", "observations"],
            "must_not" : ["columns","column_values"]
        },
        "getMinimumValueInTargetColumn" : {
            "must_need" : ["minimum", "target_column"],
            "must_not" : []
        },
        "getNthMinimumInTargetColumn" : {
            "must_need" : ["minimum", "ordinal", "target_column"],
            "must_not" : []
        },
        "getTotalObservationsInTargetColumnValue" : {
            "must_need" : ["total", "observations", "target_column_value1"],
            "must_not" : []
        },
        "getTotalObservationsOfTargetColumnValueFromColumnValue" : {
            "must_need" : ["total", "target_column_value1", "observations", "column_values"],
            "must_not" : []
        },
        "getPercentageOfObservationsInTargetColumnValue" : {
            "must_need" : ["percentage", "target_column_value1"],
            "must_not" : []
        },
        "getStatisticalRelationshipOfTargetColumnWithColumns" : {
            "must_need" : ["statistical_relation", "target_column", "variables", "do", "dimension_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getStatisticalRelationshipOfTargetColumnWithColumnsInMeasureAnalysis" : {
            "must_need" : ["statistical_relation", "target_column", "variables", "do", "measure_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getInfluencingColumnsOfTargetColumn" : {
            "must_need" : ["variables", "influence", "target_column", "dimension_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getInfluencingColumnsOfTargetColumnInMeasureAnalysis" : {
            "must_need" : ["variables", "influence", "target_column", "measure_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getTotalInfluencingColumnsOfTargetColumn" : {
            "must_need" : ["total","variables", "influence", "target_column", "dimension_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getTotalInfluencingColumnsOfTargetColumnInMeasureAnalysis" : {
            "must_need" : ["total","variables", "influence", "target_column", "measure_analysis"],
            "must_not" : ["columns", "column_values"]
        },
        "getImpactOfTargetColumnByOtherColumns" : {
            "must_need" : ["variables", "effect", "target_column", "dimension_analysis"],
            "must_not" : ["maximum", "minimum"]
        },
        "getImpactOfTargetColumnByOtherColumnsInMeasureAnalysis" : {
            "must_need" : ["variables", "effect", "target_column", "measure_analysis"],
            "must_not" : ["maximum", "minimum"]
        },
        "getStatisticalRelationshipOfTargetColumnWithOtherColumns" : {
            "must_need" : ["statistical_relation", "target_column", "variables", "dimension_analysis"],
            "must_not" : []
        },
        "getStatisticalRelationshipOfTargetColumnWithOtherColumnsInMeasureAnalysis" : {
            "must_need" : ["statistical_relation", "target_column", "variables", "measure_analysis"],
            "must_not" : []
        },
        "getStrengthBetweenColumnAndTargetColumn" : {
            "must_need" : ["strength", "columns", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getStrengthBetweenColumnAndTargetColumnInMeasureAnalysis" : {
            "must_need" : ["strength", "columns", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getMaximumRelationshipColumnWithTargetColumn" : {
            "must_need" : ["variables", "maximum", "effect", "target_column", "dimension_analysis"],
            "must_not" : ["ordinal"]
        },
        "getMaximumRelationshipColumnWithTargetColumnInMeasureAnalysis" : {
            "must_need" : ["variables", "maximum", "effect", "target_column", "measure_analysis"],
            "must_not" : ["ordinal"]
        },
        "getMinimumRelationshipColumnWithTargetColumn" : {
            "must_need" : ["variables", "minimum", "effect", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getMinimumRelationshipColumnWithTargetColumnInMeasureAnalysis" : {
            "must_need" : ["variables", "minimum", "effect", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getNthMaximumImpactColumnOnTargetColumn" : {
            "must_need" : ["variables", "ordinal", "maximum", "target_column","dimension_analysis"],
            "must_not" : []
        },
        "getNthMinimumImpactColumnOnTargetColumn" : {
            "must_need" : ["variables", "ordinal", "minimum", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getNthMaximumImpactColumnOnTargetColumnInMeasureAnalysis" : {
            "must_need" : ["variables", "ordinal", "maximum", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getNthMinimumImpactColumnOnTargetColumnInMeasureAnalysis" : {
            "must_need" : ["variables", "ordinal", "minimum", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getTotalStatisticalRelationshipOfColumnsWithTargetColumn" : {
            "must_need" : ["total", "variables", "statistical_relation", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getTotalStatisticalRelationshipOfColumnsWithTargetColumnInMeasureAnalysis" : {
            "must_need" : ["total", "variables", "statistical_relation", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getColumnInfluenceOfTargetColumn" : {
            "must_need" : ["columns", "influence", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnInfluenceOfTargetColumnInMeasureAnalysis" : {
            "must_need" : ["columns", "influence", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getChiSquareResultsForTargetColumn" : {
            "must_need" : ["chi_square", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getChiSquareResultsForTargetColumnInMeasureAnalysis" : {
            "must_need" : ["chi_square", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getPValueForChiSquareBetweenColumnAndTargetColumn" : {
            "must_need" : ["p_value", "chi_square", "columns", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getPValueForChiSquareBetweenColumnAndTargetColumnInMeasureAnalysis" : {
            "must_need" : ["p_value", "chi_square", "columns", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getTotalColumnValues" : {
            "must_need" : ["total", 'columns'],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnPercentage" : {
            "must_need" : ["columns", "maximum", "target_column", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnPercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "maximum", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMaximumTargetColumnPercentage" : {
            "must_need" : ["columns", "ordinal", "maximum", "target_column", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMaximumTargetColumnPercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "ordinal", "maximum", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMinimumTargetColumnPercentage" : {
            "must_need" : ["columns", "minimum", "target_column", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMinimumTargetColumnPercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "minimum", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMinimumTargetColumnPercentage" : {
            "must_need" : ["columns", "ordinal", "minimum", "target_column", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMinimumTargetColumnPercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "ordinal", "minimum", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnValue" : {
            "must_need" : ["maximum", "columns", "target_column_value1"],
            "must_not" : []
        },
        "getColumnValuesWithMinimumTargetColumnValue" : {
            "must_need" : ["minimum", "columns", "target_column_value1"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnValuePercentage" : {
            "must_need" : ["columns", "maximum", "target_column_value1", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMaximumTargetColumnValuePercentage" : {
            "must_need" : ["columns", "ordinal", "maximum", "target_column_value1", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValueWithMinimumTargetColumnValuePercentage" : {
            "must_need" : ["columns", "minimum", "target_column_value1", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValueWithNthMinimumTargetColumnValuePercentage" : {
            "must_need" : ["columns", "ordinal", "minimum", "target_column_value1", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnValuePercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "maximum", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithNthMaximumTargetColumnValuePercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "ordinal", "maximum", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValueWithMinimumTargetColumnValuePercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "minimum", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValueWithNthMinimumTargetColumnValuePercentageInMeasureAnalysis" : {
            "must_need" : ["columns", "ordinal", "minimum", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnWithMaximumObservationsInTargetColumn" : {
            "must_need" : ["columns", "maximum", "target_column_value1", "observations"],
            "must_not" : ["percentage"]
        },
        "getColumnValuesWithNthMaximumObservationsInTargetColumn" : {
            "must_need" : ["columns", "ordinal", "maximum", "target_column_value1", "observations"],
            "must_not" : ["percentage"]
        },
        "getColumnValuesWithMinimumObservationsInTargetColumnValue" : {
            "must_need" : ["columns", "minimum", "target_column_value1", "observations"],
            "must_not" : ["percentage"]
        },
        "getColumnValuesWithNthMinimumObservationsInTargetColumnValue" : {
            "must_need" : ["columns", "ordinal", "minimum", "target_column_value1", "observations"],
            "must_not" : ["percentage"]
        },
        "getTopNColumnValuesWithMaximumObservationsInTargetColumn" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column", "dimension_analysis"],
            "must_not" : ["percentage"]
        },
        "getTopNColumnValuesWithMaximumPercentageInTargetColumn" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getTopNColumnValuesWithMaximumObservationsInTargetColumnValue" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column_value1", "dimension_analysis"],
            "must_not" : ["percentage"]
        },
        "getTopNColumnValuesWithMaximumPercentageInTargetColumnValue" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column_value1", "percentage", "dimension_analysis"],
            "must_not" : []
        },
        "getTopNColumnValuesWithMaximumTargetColumnInMeasureAnalysis" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column", "measure_analysis"],
            "must_not" : ["percentage"]
        },
        "getTopNColumnValuesWithMaximumPercentageInTargetColumnInMeasureAnalysis" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getTopNColumnValuesWithMaximumObservationsInTargetColumnValueInMeasureAnalysis" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column_value1", "measure_analysis"],
            "must_not" : ["percentage"]
        },
        "getTopNColumnValuesWithMaximumPercentageInTargetColumnValueInMeasureAnalysis" : {
            "must_need" : ["top", "number", "columns", "maximum", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getBottomNColumnValuesWithMinimumObservationsInTargetColumnValue" : {
            "must_need" : ["bottom", "number", "minimum", "columns", "target_column_value1","dimension_analysis"],
            "must_not" : ["percentage"]
        },
        "getBottomNColumnValuesWithMinimumPercentageInTargetColumnValue" : {
            "must_need" : ["bottom", "number", "minimum", "columns", "target_column_value1", "percentage","dimension_analysis"],
            "must_not" : []
        },
        "getBottomNColumnValuesWithMinimumObservationsInTargetColumn" : {
            "must_need" : ["bottom", "number", "columns", "target_column","dimension_analysis"],
            "must_not" : ["percentage"]
        },
        "getBottomNColumnValuesWithMinimumPercentageInTargetColumn" : {
            "must_need" : ["bottom", "number", "columns", "target_column", "percentage","dimension_analysis"],
            "must_not" : []
        },
        "getBottomNColumnValuesWithMinimumObservationsInTargetColumnValueInMeasureAnalysis" : {
            "must_need" : ["bottom", "number", "minimum", "columns", "target_column_value1","measure_analysis"],
            "must_not" : ["percentage"]
        },
        "getBottomNColumnValuesWithMinimumPercentageInTargetColumnValueInMeasureAnalysis" : {
            "must_need" : ["bottom", "number", "minimum", "columns", "target_column_value1", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getBottomNColumnValuesWithMinimumObservationsInTargetColumnInMeasureAnalysis" : {
            "must_need" : ["bottom", "number", "columns", "target_column", "measure_analysis"],
            "must_not" : ["percentage"]
        },
        "getBottomNColumnValuesWithMinimumPercentageInTargetColumnInMeasureAnalysis" : {
            "must_need" : ["bottom", "number", "columns", "target_column", "percentage", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithTargetColumnValueObservationsInRange" : {
            "must_need" : ["columns", "target_column_value1", "range", "observations"],
            "must_not" : []
        },
        "getColumnValuesWithTargetColumnValuePercentageInRange" : {
            "must_need" : ["columns", "target_column_value1", "range", "percentage"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumObservations" : {
            "must_need" : ["columns", "maximum", "dimension_analysis"],
            "must_not" : ["target_column_value1"]
        },
        "getColumnValuesWithMaximumObservationsInMeasureAnalysis" : {
            "must_need" : ["columns", "maximum", "measure_analysis"],
            "must_not" : ["target_column_value1"]
        },
        "getColumnValuesWithMaximumTargetColumn" : {
            "must_need" : ["columns", "maximum", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMaximumTargetColumnInMeasureAnalysis" : {
            "must_need" : ["columns", "maximum", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMinimumTargetColumn" : {
            "must_need" : ["columns", "minimum", "target_column","dimension_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithMinimumTargetColumnInMeasureAnalysis" : {
            "must_need" : ["columns", "minimum", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getColumnValuesWithPercentageInRange" : {
            "must_need" : ["columns", "range", "percentage", "dimension_analysis"],
            "must_not" : ["target_column", "target_column_value1"]
        },
        "getColumnValuesWithPercentageInRangeInMeasureAnalysis" : {
            "must_need" : ["columns", "range", "percentage", "measure_analysis"],
            "must_not" : ["target_column", "target_column_value1"]
        },
        "getColumnValuesWithMinimumObservations": {
            "must_need" : ["columns", "minimum", "observations", "dimension_analysis"],
            "must_not" : ["target_column", "target_column_value1"]
        },
        "getColumnValuesWithMinimumObservationsInMeasureAnalysis": {
            "must_need" : ["columns", "minimum", "observations", "measure_analysis"],
            "must_not" : ["target_column", "target_column_value1"]
        },
        "getMainInsightsFromColumnAndTargetColumnAnalysis" : {
            "must_need" : ["main_insights", "columns", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getMainInsightsFromColumnAndTargetColumnInMeasureAnalysis" : {
            "must_need" : ["main_insights", "columns", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getOverviewOfTargetColumnInColumnValue" : {
            "must_need" : ["target_column", "column_values"],
            "must_not" : ["distribution"]
        },
        "getTotalObservationsInColumnValue" : {
            "must_need" : ["total", "observations", "column_values"],
            "must_not" : []
        },
        "getPredictionsOfTargetColumnValueObservations" : {
            "must_need" : ["prediction", "target_column_value1"],
            "must_not" : []
        },
        "getMostLikelyPredictionsOfTargetColumnObservations" : {
            "must_need" : ["prediction", "target_column", "maximum"],
            "must_not" : []
        },
        "getLowPredictionsOfTargetColumnObservations" : {
            "must_need" : ["prediction", "target_column", "minimum"],
            "must_not" : []
        },
        "getMostLikelyPredictionsOfTargetColumnValueObservations" : {
            "must_need" : ["prediction", "target_column_value1", "maximum"],
            "must_not" : []
        },
        "getLowPredictionsOfTargetColumnValueObservations" : {
            "must_need" : ["prediction", "target_column_value1", "minimum"],
            "must_not" : []
        },
        "getPredictionsOfTargetColumnValueObservationsFromColumnValue" : {
            "must_need" : ["prediction", "target_column_value1", "column_values"],
            "must_not" : []
        },
        "getTotalEffectingColumnsOnTargetColumnValue" : {
            "must_need" : ["total", "variables", "effect", "target_column_value1"],
            "must_not" : []
        },
        "getColumnEffectOnTargetColumnValue" : {
            "must_need" : ["columns", "effect", "target_column_value1"],
            "must_not" : []
        },
        "getColumnEffectOnTargetColumn" : {
            "must_need" : ["effect", "columns", "target_column", "dimension_analysis"],
            "must_not" : []
        },
        "getColumnEffectOnTargetColumnInMeasureAnalysis" : {
            "must_need" : ["effect", "columns", "target_column", "measure_analysis"],
            "must_not" : []
        },
        "getPredictionRules" : {
            "must_need" : ["prediction", "rules"],
            "must_not" : ["target_column_value1"]
        },
        "getDistributionOfTargetColumnValueAcrossColumn" : {
            "must_need" : ["distribution", "target_column_value1", "columns"],
            "must_not" : []
        },
        "getValuesInColumn" : {
            "must_need" : ["columns"],
            "must_not" : ["target_column_value1", "maximum", "minimum", "percentage"]
        },
        "getValuesInTargetColumn" : {
            "must_need" : ["target_column"],
            "must_not" : ["maximum", "total", "minimum", "column_values", "columns"]
        },
        "getNthQuartileOfTargetColumn" : {
            "must_need" : ["ordinal", "quartile", "target_column"],
            "must_not" : []
        },
        "getOutliersInTargetColumn" : {
            "must_need" : ["outliers", "target_column"],
            "must_not" : []
        },
        "getTotalPositiveOutliersInAnalysis" : {
            "must_need" : ["total", "positive", "outliers"],
            "must_not" : []
        },
        "getAllPositiveOutliersInAnalysis" : {
            "must_need" : ["positive", "outliers"],
            "must_not" : []
        },
        "getTotalNegativeOutliersInAnalysis" : {
            "must_need" : ["total", "negative", "outliers"],
            "must_not" : []
        },
        "getAllNegativeOutliersInAnalysis" : {
            "must_need" : ["negative", "outliers"],
            "must_not" : []
        },
        "getGrowthInTargetColumn" : {
            "must_need" : ["growth", "target_column"],
            "must_not" : []
        },
        "getPeakStageDateOfTargetColumn" : {
            "must_need" : ["when", "maximum", "target_column"],
            "must_not" : []
        },
        "getReasonsForPeak" : {
            "must_need" : ["reasons", "peak"],
            "must_not" : []
        },
        "getLowestStateDateForTargetColumnDate" : {
            "must_need" : ["when", "minimum", "target_column"],
            "must_not" : []
        },
        "getReasonsForDropInTargetColumn" : {
            "must_need" : ["reasons", "drop", "target_column"],
            "must_not" : []
        },
        "getFastGrowingColumnValues" : {
            "must_need" : ["columns", "do", "growth", "fast"],
            "must_not" : []
        },
        "getPoorGrowingColumnValues" : {
            "must_need" : ["columns", "do", "poor"],
            "must_not" : []
        },
        "getLeadersClubColumnValues" : {
            "must_need" : ["columns", "leaders_club"],
            "must_not" : []
        },
        "getAnalysisOfColumnsVsTargetColumn" : {
            "must_need" : ["columns", "target_column", "analysis"],
            "must_not" : []
        },
        "getTargetColumnFromColumnValueTrendingOverTime" : {
            "must_need" : ["column_values", "target_column", "trend", "over_time"],
            "must_not" : []
        },
        "getMeasuresThatEffectTargetColumn" : {
            "must_need" : ["measures", "target_column", "effect"],
            "must_not" : []
        },
        "getDimensionsThatEffectTargetColumn" : {
            "must_need" : ["dimensions", "target_column", "effect"],
            "must_not" : []
        },
        "getDateDimensionsThatEffectTargetColumn" : {
            "must_need" : ["date_dimensions", "target_column", "effect"],
            "must_not" : []
        },
        "getIncrementOfTargetColumnOnUnitChangeInColumn" : {
            "must_need" : ["total", "increase", "unit_change", "columns", "target_column"],
            "must_not" : []
        },
        "getPredictionsOfMaximumTargetColumnObservationsFromColumnValue" : {
            "must_need" : ["total", "prediction", "maximum", "column_value", "target_column"],
            "must_not" : []
        },
        "getKeyTakeAwaysFromAnalysis" : {
            "must_need" : ["key_take_aways"],
            "must_not" : []
        },
        "getTotalVariablesInDataSet" : {
            "must_need" : ["total", "variables"],
            "must_not" : ["columns", "column_values"]
        },
        "getNameOfSignalInAnalysis" : {
            "must_need" : ["signal", "name"],
            "must_not" : []
        },
        "getAboutSignalInAnalysis" : {
            "must_need" : ["signal", "about"],
            "must_not" : []
        },
        "getTargetColumnNameInAnalysis" : {
            "must_need" : ["target_variable"],
            "must_not" : []
        },
        "getColumnValuesInTargetColumnRangeInMeasureAnalysis" : {
            "must_need" : ["columns", "target_column", "range", "measure_analysis"],
            "must_not" : ["maximum", "minimum", "total", "percentage"]
        },
        "getColumnValuesInPercentageOfTargetColumnRangeInMeasureAnalysis" : {
            "must_need" : ["columns", "target_column", "range", "percentage"],
            "must_not" : ["maximum", "minimum", "total"]
        },
        "getColumnValuesTogetherFormPercentageOfObservations" : {
            "must_need" : ["values", "together", "percentage", "observations", "number"],
            "must_not" : ["columns", "column_values", "target_column_value1"]
        }
    };

    let functionNames = Object.keys(functionNamesObj);
    // sorting the functions based on must_need length
    functionNames = functionNames.sort(function(a, b) {
        return (functionNamesObj[b]["must_need"].length - functionNamesObj[a]["must_need"].length);
    });

    let bot_functions = {
        getFunctionName : (entities) => {
            for(let i in functionNames) {
                let function_name = functionNames[i];
                let function_name_obj = functionNamesObj[function_name];
                let must_need = function_name_obj["must_need"];
                let must_not = function_name_obj["must_not"];
                let having_list = must_need.filter(function(a){
                    return entities.hasOwnProperty(a);
                });
                let not_having_list = must_not.filter(function(a){
                    return entities.hasOwnProperty(a);
                });

                if(having_list.length == must_need.length && not_having_list.length==0) {
                    return function_name;
                }
            }
            return undefined;
        }
    };
    return bot_functions;
})();