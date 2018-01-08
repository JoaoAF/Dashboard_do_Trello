    google.load('visualization', '1', {'packages': ['corechart']});
    google.setOnLoadCallback(desenhaGrafico);

    function desenhaGrafico() {
        $(document).on("click", "#select-mes-grafico", function() {
            setTimeout(function() {
                var dados = new google.visualization.DataTable();

                dados.addColumn('string', 'Membro');
                dados.addColumn('number', 'Pontos Estimados');
                dados.addColumn('number', 'Pontos Consumidos');
                dados.addRows(dadosGrafico.length);

                for (i = 0; i < dadosGrafico.length; i++) {
                    dados.setValue(i, 0, dadosGrafico[i].nome);
                    dados.setValue(i, 1, dadosGrafico[i].pontos_estimados);
                    dados.setValue(i, 2, dadosGrafico[i].pontos_consumidos);
                }

                var grafico = new google.visualization.ColumnChart(document.getElementById('grafico_time'));
                grafico.draw(dados, {width: $(window).width(),height: 380,title: 'Pontos',vAxis: {title: ' '}});

            }, 2000);

        });
    }