const Appointment = require("./../models/Appointment");
const dateFns = require("date-fns");
const pt = require("date-fns/locale/pt");
const User = require("./../models/User");
const File = require("./../models/File");
const Notification = require("./../schemas/Notification");
const Queue = require("./../../services/Queue");
const CancelationMail = require("./../jobs/CancelantionMail");
let Yup = require("yup");
class AppointmentController {
    async index(req, res) {
        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ["date"],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ["id", "date", "past", "cancelable"],
            include: [
                {
                    model: User,
                    as: "provider",
                    attributes: ["id", "name"],
                    include: [
                        {
                            model: File,
                            as: "avatar",
                            attributes: ["id", "path", "url"]
                        }
                    ]
                }
            ]
        });

        return res.json(appointments);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            date: Yup.date().required(),
            provider_id: Yup.number().required()
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: "Validations fails." });
        }

        const { provider_id, date } = req.body;

        //Check if provider_id is a provider
        const isProvider = await User.findOne({
            where: {
                id: provider_id,
                provider: true
            }
        });

        if (!isProvider) {
            return res.status(401).json({
                error: "You can only create appointments with providers."
            });
        }

        const hourStart = dateFns.startOfHour(dateFns.parseISO(date));

        /**
         * Check for past dates
         */
        if (dateFns.isBefore(hourStart, new Date())) {
            return res
                .status(400)
                .json({ error: "Past dates are not permitted." });
        }

        /**
         *  Check date availability
         */

        const checkAvailability = await Appointment.findOne({
            where: { provider_id, canceled_at: null, date: hourStart }
        });

        if (checkAvailability) {
            return res
                .status(400)
                .json({ error: "Appointment date is not available." });
        }

        /**
         * Check if provider is trying make an appointment
         */
        if (req.userId === provider_id) {
            return res.status(400).json({
                error: "User cannot make an appointment as a provider"
            });
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        });

        /**
         * Notify provider
         */
        const user = await User.findByPk(req.userId);

        const formatDate = dateFns.format(
            hourStart,
            "'dia' dd 'de' MMMM', ás' H:mm'h'",
            {
                locale: pt
            }
        );
        await Notification.create({
            content: `Novo agendamento de ${user.name} para o ${formatDate}`,
            user: provider_id
        });

        return res.json(appointment);
    }

    async destroy(req, res) {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "provider",
                    attributes: ["name", "email"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["name"]
                }
            ]
        });

        if (appointment.user_id !== req.userId) {
            return res.status(401).json({
                error: "You don't have permission to cancel this appointment"
            });
        }

        const dateWithSub = dateFns.subHours(appointment.date, 2);

        if (dateFns.isBefore(dateWithSub, new Date())) {
            return res.status(401).json({
                error: "You can only cancel appointments 2  hours in advance."
            });
        }

        appointment.canceled_at = new Date();

        await appointment.save();

        await Queue.add(CancelationMail.key, {
            appointment
        });

        return res.json(appointment);
    }
}

module.exports = new AppointmentController();
