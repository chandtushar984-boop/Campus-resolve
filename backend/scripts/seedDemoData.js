import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../src/database/db.js";
import User from "../src/models/user.model.js";
import Club from "../src/models/club.model.js";
import ClubMembership from "../src/models/clubMembership.model.js";
import ClubAnnouncement from "../src/models/clubAnnouncement.model.js";

dotenv.config();

const seedDemoData = async () => {
    try {
        await connectDB();

        const studentPassword = await bcrypt.hash(
            process.env.DEMO_STUDENT_PASSWORD || "DemoStudent@123",
            10
        );
        const headPassword = await bcrypt.hash(
            process.env.DEMO_CLUB_HEAD_PASSWORD || "DemoHead@123",
            10
        );
        const facultyPassword = await bcrypt.hash(
            process.env.DEMO_FACULTY_PASSWORD || "DemoFaculty@123",
            10
        );

        const faculty = await User.findOneAndUpdate(
            { email: "faculty.demo@krmu.edu.in" },
            {
                name: "Dr. Ananya Verma",
                email: "faculty.demo@krmu.edu.in",
                password: facultyPassword,
                rollNo: "FACDEMO01",
                course: "Faculty of Engineering",
                semester: "N/A",
                role: "faculty",
                managedClub: null,
                isDemo: true,
            },
            { upsert: true, new: true }
        );

        const student = await User.findOneAndUpdate(
            { email: "2301010099@krmu.edu.in" },
            {
                name: "Aarav Mehta",
                email: "2301010099@krmu.edu.in",
                password: studentPassword,
                rollNo: "2301010099",
                course: "B.Tech CSE",
                semester: "5th",
                role: "student",
                managedClub: null,
                isDemo: true,
            },
            { upsert: true, new: true }
        );

        const clubHead = await User.findOneAndUpdate(
            { email: "2301010098@krmu.edu.in" },
            {
                name: "Priya Nair",
                email: "2301010098@krmu.edu.in",
                password: headPassword,
                rollNo: "2301010098",
                course: "B.Tech AI/ML",
                semester: "6th",
                role: "club_head",
                isDemo: true,
            },
            { upsert: true, new: true }
        );

        const sampleClubs = [
            {
                name: "AI & Robotics Society",
                category: "Technical",
                description:
                    "Hands-on workshops, hackathons, and research reading groups focused on machine learning, robotics, and intelligent systems.",
                logo: "",
                clubHead: clubHead._id,
                createdBy: faculty._id,
            },
            {
                name: "Cultural & Performing Arts Collective",
                category: "Cultural",
                description:
                    "Music, drama, dance, and annual cultural showcases celebrating campus creativity and student talent.",
                logo: "",
                clubHead: null,
                createdBy: faculty._id,
            },
            {
                name: "Open Source & Coding Club",
                category: "Technical",
                description:
                    "Collaborative software engineering, competitive programming, and university open-source initiatives.",
                logo: "",
                clubHead: null,
                createdBy: faculty._id,
            },
        ];

        const clubs = [];
        for (const clubData of sampleClubs) {
            const club = await Club.findOneAndUpdate(
                { name: clubData.name },
                clubData,
                { upsert: true, new: true }
            );
            clubs.push(club);
        }

        const primaryClub = clubs[0];
        clubHead.managedClub = primaryClub._id;
        await clubHead.save();

        await ClubMembership.findOneAndUpdate(
            { club: primaryClub._id, user: clubHead._id },
            { club: primaryClub._id, user: clubHead._id, role: "head" },
            { upsert: true, new: true }
        );

        await ClubMembership.findOneAndUpdate(
            { club: primaryClub._id, user: student._id },
            { club: primaryClub._id, user: student._id, role: "member" },
            { upsert: true, new: true }
        );

        const existingAnnouncements = await ClubAnnouncement.countDocuments({
            club: primaryClub._id,
        });

        if (existingAnnouncements === 0) {
            await ClubAnnouncement.create([
                {
                    club: primaryClub._id,
                    title: "Welcome to the Fall Semester!",
                    content:
                        "Orientation and project team formation for new members will take place this Friday at 4:00 PM in Lab 302.",
                    createdBy: clubHead._id,
                    isPinned: true,
                },
                {
                    club: primaryClub._id,
                    title: "Call for Robotics Lab Volunteers",
                    content:
                        "Interested members can reach out to the club coordinator to assist with inventory and hardware setup.",
                    createdBy: clubHead._id,
                    isPinned: false,
                },
            ]);
        }

        console.log("Demo accounts, clubs, memberships, and announcements seeded successfully.");
    } catch (error) {
        console.error("Failed to seed demo data:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seedDemoData();
