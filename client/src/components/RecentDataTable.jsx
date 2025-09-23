import { Button, Table } from 'flowbite-react';
import { Link } from 'react-router-dom';

// A reusable table for displaying lists of recent data.
export default function RecentDataTable({ title, headers, data, renderRow, linkTo }) {
    return (
        <div className='flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800'>
            <div className='flex justify-between p-3 text-sm font-semibold'>
                <h1 className='text-center p-2'>{title}</h1>
                <Button outline gradientDuoTone='purpleToPink'>
                    <Link to={linkTo}>See all</Link>
                </Button>
            </div>
            <Table hoverable>
                <Table.Head>
                    {/* Dynamically create table headers */}
                    {headers.map((header) => (
                        <Table.HeadCell key={header}>{header}</Table.HeadCell>
                    ))}
                </Table.Head>
                {data && data.length > 0 ? (
                    data.map((item) => renderRow(item)) // Use the renderRow function prop
                ) : (
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell colSpan={headers.length} className='text-center py-4'>
                                No data to show.
                            </Table.Cell>
                        </Table.Row>
                    </Table.Body>
                )}
            </Table>
        </div>
    );
}