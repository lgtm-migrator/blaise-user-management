import React, { ReactElement, useEffect, useState } from "react";
import { getAllRoles } from "../../utilities/http";
import { Link } from "react-router-dom";
import { ONSErrorPanel, ONSLoadingPanel, ONSPanel } from "blaise-design-system-react-components";
import Breadcrumbs from "../../Components/Breadcrumbs";
import RolesTable from "./RolesTable";
import { UserRole } from "blaise-api-node-client";

function Roles(): ReactElement {
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [listError, setListError] = useState<string>("Loading ...");
    const [listLoading, setListLoading] = useState<boolean>(true);

    useEffect(() => {
        getRolesList().then(() => console.log("Call getRolesList Complete"));
    }, []);

    async function getRolesList() {
        setRoles([]);
        setListLoading(true);

        const [success, roleList] = await getAllRoles();
        setListLoading(false);

        if (!success) {
            setListError("Unable to load roles.");
            return;
        }

        console.log(roleList);

        if (roleList.length === 0) {
            setListError("No installed roles found.");
        }

        setRoles(roleList);
    }


    return (
        <>
            <Breadcrumbs BreadcrumbList={
                [
                    { link: "/", title: "Home" },
                ]
            } />

            <main id="main-content" className="page__main u-mt-no">
                <h1 className="u-mb-l">Manage roles</h1>

                <ONSPanel>Roles are created and managed by DST to ensure consistency across environments, please contact DST if you need a new role</ONSPanel>

                {listError.includes("Unable") && <ONSErrorPanel />}

                {
                    listLoading ?
                        <ONSLoadingPanel />
                        :
                        <RolesTable roles={roles} listError={listError} />
                }
            </main>
        </>
    );
}


export default Roles;
