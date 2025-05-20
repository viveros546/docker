                // Asegurarse de que el script se ejecute después de cargar el DOM
                document.addEventListener('DOMContentLoaded', (event) => {
                    // Obtener los datos del pipeline desde Flask (convertidos a JSON)
                    // Usamos |tojson|safe para evitar problemas con caracteres especiales HTML
                    const rawData = document.getElementById("pipelineData").dataset.json;
                    const pipelineData = JSON.parse(rawData || "{}"); // Convertir JSON a objeto JavaScript

                    const steps = Object.entries(pipelineData); // Convertir objeto a array [key, value]

                    const canvas = document.getElementById('pipelineCanvas');
                    if (canvas.getContext) {
                        const ctx = canvas.getContext('2d');
                        const canvasWidth = canvas.width;
                        const canvasHeight = canvas.height;

                        // --- Parámetros de Dibujo ---
                        const boxWidth = 120;
                        const boxHeight = 60;
                        const gap = 40; 
                        const startX = 30;
                        const startY = canvasHeight / 2 - boxHeight / 2; 
                        const arrowOffsetY = 15; 
                        const dataPacketRadius = 8;
                        const animationSpeed = 1; 
                        // Aumentar altura de la caja de texto
                        const dataBoxHeight = 50; // Altura de la caja de texto (antes 40)
                        const dataBoxPadding = 10; 
                        const lineHeight = 14; // Altura estimada por línea de texto

                        let currentStepIndex = 0; // Índice del paso actual en la animación
                        let dataPacketX = startX + boxWidth / 2; // Posición X inicial del paquete de datos
                        let dataPacketY = startY - arrowOffsetY - 15; // Posición Y inicial del paquete
                        let targetX = dataPacketX; // Posición X objetivo del paquete
                        let animating = false; // Flag para controlar si la animación está activa

                        // --- Funciones de Dibujo ---
                        function drawFilterBox(x, y, text) {
                            ctx.fillStyle = '#e9ecef'; // Gris claro
                            ctx.strokeStyle = '#0056b3'; // Azul Unicomfacauca
                            ctx.lineWidth = 2;
                            ctx.fillRect(x, y, boxWidth, boxHeight);
                            ctx.strokeRect(x, y, boxWidth, boxHeight);

                            ctx.fillStyle = '#333';
                            ctx.font = '12px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(text, x + boxWidth / 2, y + boxHeight / 2 + 5);
                        }

                        function drawArrow(x1, y1, x2, y2) {
                            ctx.strokeStyle = '#555';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            // Punta de la flecha
                            ctx.lineTo(x2 - 8, y2 - 4);
                            ctx.moveTo(x2, y2);
                            ctx.lineTo(x2 - 8, y2 + 4);
                            ctx.stroke();
                        }
                        
                        // MODIFICADA: Dibuja una caja y el texto de datos dentro (con ajuste de línea simple)
                        function drawDataText(boxX, boxY, text) {
                             // Dibujar la caja de fondo
                             ctx.fillStyle = '#f8f9fa'; 
                             ctx.strokeStyle = '#adb5bd'; 
                             ctx.lineWidth = 1;
                             ctx.fillRect(boxX, boxY, boxWidth, dataBoxHeight); 
                             ctx.strokeRect(boxX, boxY, boxWidth, dataBoxHeight);

                             // Dibujar el texto dentro de la caja
                             ctx.fillStyle = '#212529'; 
                             ctx.font = '11px sans-serif'; 
                             ctx.textAlign = 'center';
                             // ctx.textBaseline = 'middle'; // Cambiamos a 'top' para manejar múltiples líneas

                             const textPadding = 5; // Pequeño padding dentro de la caja
                             const maxWidth = boxWidth - (textPadding * 2); // Ancho máximo para el texto

                             // Lógica simple de ajuste de línea (word wrap básico)
                             const words = text.split(' ');
                             let line = '';
                             let lines = [];
                             
                             for(let n = 0; n < words.length; n++) {
                               const testLine = line + words[n] + ' ';
                               const metrics = ctx.measureText(testLine);
                               const testWidth = metrics.width;
                               if (testWidth > maxWidth && n > 0) {
                                 lines.push(line.trim()); // Añadir línea anterior
                                 line = words[n] + ' '; // Empezar nueva línea
                               } else {
                                 line = testLine; // Añadir palabra a la línea actual
                               }
                             }
                             lines.push(line.trim()); // Añadir la última línea

                             // Dibujar las líneas (máximo 2 para esta caja)
                             ctx.textBaseline = 'top'; // Alinear desde arriba
                             const startTextY = boxY + textPadding; // Y inicial para la primera línea
                             for(let i = 0; i < lines.length && i < 2; i++) { // Limitar a 2 líneas
                                const lineY = startTextY + (i * lineHeight);
                                // Truncar si aún así es muy larga (poco probable con wrap)
                                let lineToDraw = lines[i];
                                if (ctx.measureText(lineToDraw).width > maxWidth) {
                                    // Simple truncamiento si una palabra es demasiado larga
                                    while (ctx.measureText(lineToDraw + '...').width > maxWidth && lineToDraw.length > 0) {
                                        lineToDraw = lineToDraw.substring(0, lineToDraw.length - 1);
                                    }
                                    lineToDraw += '...';
                                }
                                ctx.fillText(lineToDraw, boxX + boxWidth / 2, lineY);
                             }
                        }

                        function drawDataPacket(x, y) {
                            ctx.fillStyle = 'red';
                            ctx.beginPath();
                            ctx.arc(x, y, dataPacketRadius, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // --- Lógica de Animación ---
                        function animate() {
                            ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Limpiar canvas

                            let currentX = startX;
                            
                            // Dibujar todos los filtros, flechas y cajas de datos estáticas primero
                            steps.forEach(([stepName, stepData], index) => {
                                // Extraer nombre corto del filtro
                                let displayName = stepName.includes(':') ? stepName.split(':')[1].trim() : stepName;
                                if (displayName.length > 15) displayName = displayName.substring(0, 13) + '...'; // Acortar si es muy largo

                                // Dibujar el filtro
                                drawFilterBox(currentX, startY, displayName);

                                // Dibujar la caja con el texto de datos DEBAJO del filtro
                                const dataBoxX = currentX; // Alinear X con el filtro
                                const dataBoxY = startY + boxHeight + dataBoxPadding; // Posicionar debajo con padding
                                drawDataText(dataBoxX, dataBoxY, stepData); // Llamar a la función modificada

                                // Dibujar flecha hacia el siguiente (si no es el último)
                                if (index < steps.length - 1) {
                                    const arrowStartX = currentX + boxWidth;
                                    const arrowEndX = currentX + boxWidth + gap;
                                    drawArrow(arrowStartX, startY + boxHeight / 2, arrowEndX, startY + boxHeight / 2);
                                }
                                
                                // ELIMINADA la llamada anterior a drawDataText que dibujaba texto verde sin caja
                                // const textX = index === 0 ? currentX + boxWidth / 2 : currentX - gap / 2;
                                // const textY = startY + boxHeight + arrowOffsetY + 5; 
                                // drawDataText(textX, textY, stepData); // <--- ESTA LÍNEA SE ELIMINA O COMENTA


                                currentX += boxWidth + gap; // Mover X para el siguiente filtro
                            });


                            // Mover el paquete de datos
                            if (animating) {
                                if (dataPacketX < targetX) {
                                    dataPacketX += animationSpeed;
                                    if (dataPacketX > targetX) dataPacketX = targetX; 
                                } else if (dataPacketX > targetX) {
                                     dataPacketX -= animationSpeed; 
                                     if (dataPacketX < targetX) dataPacketX = targetX;
                                }

                                const currentFilterCenterX = startX + currentStepIndex * (boxWidth + gap) + boxWidth / 2;
                                if (Math.abs(dataPacketX - currentFilterCenterX) < animationSpeed) {
                                     if (currentStepIndex < steps.length - 1) {
                                         currentStepIndex++;
                                         targetX = startX + currentStepIndex * (boxWidth + gap) + boxWidth / 2; 
                                         dataPacketX = startX + (currentStepIndex-1) * (boxWidth + gap) + boxWidth + gap/2; 
                                         dataPacketY = startY + boxHeight / 2; 
                                     } else {
                                         animating = false; 
                                         dataPacketY = startY - arrowOffsetY - 15; 
                                     }
                                }
                            }
                            
                            // Dibujar el paquete de datos en su posición actual
                            drawDataPacket(dataPacketX, dataPacketY);


                            // Continuar la animación si está activa
                            if (animating) {
                                requestAnimationFrame(animate);
                            } else {
                                console.log("Animación completada");
                            }
                        }

                        // Iniciar la animación
                        if (steps.length > 0) {
                            // Establecer el objetivo inicial (centro del primer filtro)
                            targetX = startX + boxWidth / 2;
                            dataPacketX = startX - gap/2; // Empezar justo antes del primer filtro
                            dataPacketY = startY + boxHeight / 2; // Alinear con la flecha
                            currentStepIndex = 0;
                            animating = true;
                            animate(); // Iniciar el bucle de animación
                        }

                    } else {
                        console.error("Canvas no soportado por el navegador.");
                        // Mostrar mensaje alternativo si canvas no es soportado
                        const canvasContainer = document.querySelector('.canvas-container');
                        if(canvasContainer) {
                            canvasContainer.innerHTML += '<p style="color: red;">Tu navegador no soporta Canvas, la visualización animada no está disponible.</p>';
                        }
                    }
                });