const Mail = require("./../../services/Mail");
const dateFns = require("date-fns");
const pt = require("date-fns/locale/pt");
class CancelationMail {
    get key() {
        return "CancelationMail";
    }

    async handle({ data }) {
        const { appointment } = data;
        await Mail.sendMail({
            to: `${appointment.provider.name} <${appointment.provider.email}>`,
            subject: "agendamento cancelado.",
            template: "cancelation",
            context: {
                provider: appointment.provider.name,
                user: appointment.user.name,
                date: dateFns.format(
                    dateFns.parseISO(appointment.date),
                    "'dia' dd 'de' MMMM', ás' H:mm'h'",
                    {
                        locale: pt
                    }
                )
            }
        });
    }
}

module.exports = new CancelationMail();
