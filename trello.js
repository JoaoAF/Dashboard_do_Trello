    var objetoBoard = [];
    var objetoCardsDoProjeto = [];
    var objetoMembro = [];
    var objetoCardsDoMembro = [];
    var BoardEtiqueta;
    var BoardDataEntrega;
    var BoardAtraso = "<div class='alert alert-success'><strong>Sem atraso</strong></div>";
    var BoardDiasAtraso;
    var BoardMembro;
    var BoardBoardPontosEstimados;
    var BoardPontosConsumidos;
    var BoardPontosEstm = 0;
    var BoardPontosCons = 0;
    var BoardStatus;
    var BoardPorcentagem;
    var BoardSituacao;
    var dadosGrafico = [];
    var idOrganization = 2303;

    var obterBoards = function() {

        Trello.get(
            '/members/me/boards/',
            function(boards) {
                $.each(boards, function(index, value) {

                    objetoBoard[index] = {
                        BoardID: value.id,
                        BoardName: value.name,
                        BoardUrl: value.url,
                        BoardClosed: value.closed
                    };

                    if (objetoBoard[index].BoardClosed == false) {

                        $("#open-projects").append("<div class='projects' data-toggle='modal' data-target='#myModal'>" +
                            "<strong class='title-project' data-name='" + objetoBoard[index].BoardName + "'>" + objetoBoard[index].BoardName + "</strong class='title-project'>" +
                            "<a href='" + objetoBoard[index].BoardUrl + "' target='_blank'>Link para o trello</a>" +
                            "<span style='display:none' id=" + objetoBoard[index].BoardID + "></span>" +
                            "<a class='click-modal' href='#'>Click para ver as atividades desse projeto</a>" +
                            "</div>");
                    }

                    if (value.idOrganization != null) {
                        idOrganization = value.idOrganization;
                    }

                });

                Trello.get('batch?urls=/members/me/avatarHash,/members/me/fullName', function(user) {
                    $("#user").append("<img data-toggle='tooltip' data-placement='left' title='" + user[1][200] + "' src='http://trello-avatars.s3.amazonaws.com/" + user[0][200] + "/50.png' alt='Foto user'>");
                });

                Trello.organizations.get(''+idOrganization+'/members/',
                    listarMembros,
                    function(data) {
                        console.log('Algo errado ao buscar os membros.')
                });

                Trello.organizations.get(''+idOrganization+'/members/',
                    listarMembrosGrafico,
                    function(data) {
                        console.log('Algo errado ao buscar os membros.')
                });
            },
            function(data) {
                console.log('Algum problema no metodo obterBoards');
            }
        );
    };

    var contadorQtdCards = 0;
    var contadorQtdCardsFeitos = 0;
    var listarCardsDosProjetos = function() {

        $(document).on("click", ".projects", function(boards) {
            var idProject = $(this).find('span').attr('id');
            var nameProject = $(this).find('strong').data('name');
            $(".modal-title").html(nameProject);

            Trello.get(
                '/boards/' + idProject + '/cards',
                function(boards) {

                    $.each(boards, function(index, value) {

                        Trello.get('batch?urls=/lists/' + value.idList + '/name,' +
                            '/members/' + value.idMembers[0] + '/avatarHash,' +
                            '/members/' + value.idMembers[0] + '/fullName',
                            function(posicao_membro) {
                                objetoCardsDoProjeto[index] = {
                                    Nome: value.name,
                                    Url: value.url,
                                    Etiqueta: value.labels,
                                    DataEntrega: value.due,
                                    Posicao: posicao_membro[0][200],
                                    MembroAvatar: posicao_membro[1][200],
                                    MembroFullName: posicao_membro[2][200]
                                };

                                filtrosDados(objetoCardsDoProjeto[index]);

                                $('.modal-body table tbody').append("<tr>" +
                                    "<td><a style='color:#000' target='_blank' href='" + objetoCardsDoProjeto[index].Url + "'>" + objetoCardsDoProjeto[index].Nome + "</a></td>" +
                                    "<td>" + BoardEtiqueta + "</td>" +
                                    "<td>" + BoardDataEntrega + "</td>" +
                                    "<td>" + BoardAtraso + "</td>" +
                                    "<td><div class='alert alert-info'><strong>" + BoardPontosEstimados + "</strong></div></td>" +
                                    "<td><div class='alert alert-info'><strong>" + BoardPontosConsumidos + "</strong></div></td>" +
                                    "<td><div class='alert alert-info'><strong>" + objetoCardsDoProjeto[index].Posicao + "</strong></div></td>" +
                                    "<td>" + BoardMembro + "</td>");

                                $(".dados-projeto #pontos-estimados span").html(" <u>" + BoardPontosEstm + "<u>");
                                $(".dados-projeto #pontos-consumidos span").html(" <u>" + BoardPontosCons + "<u>");
                                $(".dados-projeto #qtd-cards span").html(" <u>" + contadorQtdCards + "<u>");
                                $(".dados-projeto #qtd-cards-feitos span").html(" <u>" + contadorQtdCardsFeitos + "<u>");
                                $(".dados-projeto #status span").html(" <b>" + BoardStatus.substr(0, 5) + "%</b> - " + BoardSituacao);

                            });
                    });
                },
                function(data) {
                    console.log('Algum problema no método listarCardsDosProjetos');
                }
            );
        });

    };
    listarCardsDosProjetos();

    var listarMembros = function(membros) {
        $.each(membros, function(index, value) {
            Trello.get('/members/' + value.id, function(membro) {
                objetoMembro[index] = {
                    id: membro.id,
                    nome: membro.fullName,
                    atividades: membro.idBoards,
                    avatarHash: membro.avatarHash
                };

                $('#membros').append("<div class='membro-time' data-toggle='modal' data-target='#myModal'>" +
                    '<span style="display:none" id=' + objetoMembro[index].id + '></span>' +
                    '<img class="img-membro" src="http://trello-avatars.s3.amazonaws.com/' + objetoMembro[index].avatarHash + '/50.png" alt="membro">' +
                    "<p class='fullName-membro' name='" + objetoMembro[index].nome + "'>" + objetoMembro[index].nome + "</p>" +
                    "</div>");

            });
        });
    };

    function graficoDesempenho(membro_id, nome, mes_do_grafico) {

        dadosGrafico = [];
        Trello.get('/members/' + membro_id + '/cards', function(cards_membro) {
            var pontosConsumidos = 0;
            var pontosEstimados = 0;
            $.each(cards_membro, function(index, value) {
            console.log(String(mes_do_grafico));

                if (value.due != null & new Date(value.due).toLocaleString().substr(3,7) == String(mes_do_grafico)) {

                    if (pontos = value.name.match(/\[\d{1,}\.*\d*\]/g)) {
                        pontos = pontos[0];
                        pontos = parseFloat(pontos.replace('[', '').replace(']', ''));
                        pontosConsumidos += pontos;
                    }
                    if (pontos = value.name.match(/\(\d{1,}\.*\d*\)/g)) {
                        pontos = pontos[0];
                        pontos = parseFloat(pontos.replace('(', '').replace(')', ''));
                        pontosEstimados += pontos;
                    }
                }
            });
            dadosGrafico.push({
                'nome': nome,
                'pontos_consumidos': pontosConsumidos,
                'pontos_estimados': pontosEstimados
            });
        });

    };

    var listarMembrosGrafico = function(membros) {
        $.each(membros, function(index, value) {

            Trello.get('/members/' + value.id, function(membro) {

                $('#select-mes-grafico').change(function(){

                var mes_do_grafico = $('#select-mes-grafico').val();
                   Trello.get('/members/'+value.id+'/avatarHash', function(avatarHash) {
                        graficoDesempenho(value.id, value.fullName, mes_do_grafico);
                    });

                });

            });
        });
    };

    var listarCardsDosMembros = function() {
        $(document).on("click", ".membro-time", function() {
            var idMembro = $(this).find('span').attr('id');
            var nomeMembro = $(this).find('p').attr('name');
            $('.modal-title').html(nomeMembro);
            $('#projetos').css('display', 'block');
            $('.modal-body table thead tr th:last-child').css('display', 'none');

            Trello.get('members/' + idMembro + '/boards/', function(boards) {
                $.each(boards, function(index, value) {
                    if (value.closed == false) {
                        $('.projetos-membro').append("<div><a style='color:#000;' target='_blank' href='" + value.url + "'>" + value.name + "</a></div>");
                    }
                });
            });

            Trello.get('/members/' + idMembro + '/cards', function(cards_membro) {
                $.each(cards_membro, function(index, value) {

                    Trello.get('/lists/' + value.idList + '/name',
                        function(posicao_membro) {
                            objetoCardsDoMembro[index] = {
                                Nome: value.name,
                                Url: value.url,
                                Etiqueta: value.labels,
                                DataEntrega: value.due,
                                Posicao: posicao_membro._value
                            };

                            filtrosDados(objetoCardsDoMembro[index]);

                            $('.modal-body table tbody').append("<tr>" +
                                "<td><a style='color:#000' target='_blank' href='" + objetoCardsDoMembro[index].Url + "'>" + objetoCardsDoMembro[index].Nome + "</a></td>" +
                                "<td>" + BoardEtiqueta + "</td>" +
                                "<td>" + BoardDataEntrega + "</td>" +
                                "<td>" + BoardAtraso + "</td>" +
                                "<td><div class='alert alert-info'><strong>" + BoardPontosEstimados + "</strong></div></td>" +
                                "<td><div class='alert alert-info'><strong>" + BoardPontosConsumidos + "</strong></div></td>" +
                                "<td><div class='alert alert-info'><strong>" + objetoCardsDoMembro[index].Posicao + "</strong></div></td>");

                            $(".dados-projeto #pontos-estimados span").html(" <u>" + BoardPontosEstm + "<u>");
                            $(".dados-projeto #pontos-consumidos span").html(" <u>" + BoardPontosCons + "<u>");
                            $(".dados-projeto #qtd-cards span").html(" <u>" + contadorQtdCards + "<u>");
                            $(".dados-projeto #qtd-cards-feitos span").html(" <u>" + contadorQtdCardsFeitos + "<u>");
                            $(".dados-projeto #status span").html(" <b>" + BoardStatus.substr(0, 5) + "% de suas atividades concluidas<b>");


                        });
                });
            });

        });
    };
    listarCardsDosMembros();

        function filtrosDados(objeto) {

        if (objeto.Etiqueta.length == 0) {
            BoardEtiqueta = "<div class='alert alert-warning'><strong>Sem etiqueta</strong></div>"
        } else {
            BoardEtiqueta = "<div class='alert alert-info'><strong>" + objeto.Etiqueta[0].name + "</strong></div>";
        }

        if (objeto.DataEntrega == null) {
            BoardDataEntrega = "<div class='alert alert-danger'><strong>Sem data</strong></div>";
            BoardAtraso = "<div class='alert alert-danger'><strong> --- </strong></div>";
        }

        if (objeto.DataEntrega) {
            BoardDataEntrega = "<div class='alert alert-info'><strong>" + new Date(objeto.DataEntrega).toLocaleString() + "</strong></div>";
            BoardDiasAtraso = parseInt((new Date(objeto.DataEntrega) - new Date()) / (1000 * 60 * 60 * 24));
            if (BoardDiasAtraso < 0) {
                BoardAtraso = "<div class='alert alert-danger'><strong>" + BoardDiasAtraso * -1 + "</strong></div>"
            }
            if (BoardDiasAtraso >= 0) {
                BoardAtraso = "<div class='alert alert-success'><strong>Sem atraso</strong></div>"
            }
            if (objeto.Posicao == "DONE") {
                BoardAtraso = "<div class='alert alert-success'><strong>Tarefa concluida</strong></div>"
            }
        }

        if (objeto.MembroAvatar) {
            BoardMembro = "<img data-toggle='tooltip' data-placement='left' title='" + objeto.MembroFullName + "' src='http://trello-avatars.s3.amazonaws.com/" + objeto.MembroAvatar + "/50.png' alt='Foto do membro'>"
        } else {
            BoardMembro = "<div class='alert alert-warning'><strong> Sem membro </strong></div>"
        }

        if (BoardPontosEstimados = objeto.Nome.match(/\(\d{1,}\.*\d*\)/g)) {
            BoardPontosEstimados = String(BoardPontosEstimados[0]);
            BoardPontosEstimados = BoardPontosEstimados.replace('(', '').replace(')', '');
            BoardPontosEstimados = parseFloat(BoardPontosEstimados);
            BoardPontosEstm += BoardPontosEstimados;
        } else {
            BoardPontosEstimados = 0;
            BoardPontosEstm += 0;
        }

        if (BoardPontosConsumidos = objeto.Nome.match(/\[\d{1,}\.*\d*\]/g)) {
            BoardPontosConsumidos = String(BoardPontosConsumidos[0]);
            BoardPontosConsumidos = BoardPontosConsumidos.replace('[', '').replace(']', '');
            BoardPontosConsumidos = parseFloat(BoardPontosConsumidos);
            BoardPontosCons += BoardPontosConsumidos;
        } else {
            BoardPontosConsumidos = 0;
            BoardPontosCons += 0;
        }

        if (BoardPorcentagem == 0) {
            BoardSituacao = "<strong>A fazer</strong>"
        }
        if (BoardPorcentagem > 0) {
            BoardSituacao = "<strong>Fazendo</strong>"
        }
        if (BoardPorcentagem > 90) {
            BoardSituacao = "<strong>Terminando</strong>"
        }
        if (BoardPorcentagem == 100) {
            BoardSituacao = "<strong>Concluido</strong>"
        }

        if (objeto.Posicao == 'DONE' == true) {
            contadorQtdCardsFeitos++
        }

        contadorQtdCards++

        BoardPorcentagem = (100 / contadorQtdCards) * contadorQtdCardsFeitos;
        BoardStatus = BoardPorcentagem.toLocaleString();
    };

    $('header h1').click(function() {
        location.reload();
    });

    $(document).on("click", ".modal-header button", function() {
        $('.modal-body table tbody tr').remove();
        $('#projetos').css('display', 'none');
        $('.projetos-membro div').remove();
        $('.dados-projeto #status').css('display', 'block');
        $('.modal-body table thead tr th:last-child').css('display', 'block');
        BoardPontosEstm = 0;
        BoardPontosCons = 0;
        contadorQtdCards = 0;
        contadorQtdCardsFeitos = 0;
        $(".dados-projeto #pontos-estimados span").html("");
        $(".dados-projeto #pontos-consumidos span").html("");
        $(".dados-projeto #qtd-cards span").html("");
        $(".dados-projeto #qtd-cards-feitos span").html("");
        $(".dados-projeto #status span").html("");
    });
    $(document).on("click", ".modal-footer button", function() {
        $('.modal-body table tbody tr').remove();
        $('#projetos').css('display', 'none');
        $('.projetos-membro div').remove();
        $('.dados-projeto #status').css('display', 'block');
        $('.modal-body table thead tr th:last-child').css('display', 'block');
        BoardPontosEstm = 0;
        BoardPontosCons = 0;
        contadorQtdCards = 0;
        contadorQtdCardsFeitos = 0;
        $(".dados-projeto #pontos-estimados span").html("");
        $(".dados-projeto #pontos-consumidos span").html("");
        $(".dados-projeto #qtd-cards span").html("");
        $(".dados-projeto #qtd-cards-feitos span").html("");
        $(".dados-projeto #status span").html("");
    });

    $('section.container').css({
        'min-height': $(window).height() - 140
    });
    $('.modal-content').css({
        'min-height': $(window).height() - 40
    });
    $('.modal-body').css({
        'min-height': $(window).height() - 160
    });

    var authenticationFailure = function() {
        console.log('API do trello não consegue se autenticar');
    };

    Trello.authorize({
        type: 'popup',
        name: 'Getting Started Application',
        scope: {
            read: 'true',
            write: 'true'
        },
        expiration: 'never',
        success: obterBoards,
        error: authenticationFailure
    });